jest.mock('@/repository/MovementRepository', () => ({
  movementRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('@/lib/database');

import path from 'path';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { movementService } from '@/service/MovementService';
import { movementRepository } from '@/repository/MovementRepository';
import { getDataSource } from '@/lib/database';
import { Movement } from '@/entity/Movement';
import { MovementType } from '@/entity/MovementType';
import { Product } from '@/entity/Product';
import { createEmptyContext, ScenarioContext } from '../support/context/ScenarioContext';
import {
  BDD_ADMIN_ID,
  BDD_MOVEMENT_ID,
  BDD_PRODUCT_ID,
  BDD_USER_ID,
  buildElectroterapiaProduct,
} from '../support/helpers/productFactory';
import { createQueryRunnerMock } from '../support/helpers/queryRunnerMock';

const feature = loadFeature(path.join(__dirname, '../features/trazabilidad.feature'));

defineFeature(feature, (test) => {
  let ctx: ScenarioContext;
  let existingMovement: Movement;
  let product: Product;
  let queryRunner: ReturnType<typeof createQueryRunnerMock>;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = createEmptyContext();
    ctx.adminUserId = BDD_ADMIN_ID;

    existingMovement = {
      id: BDD_MOVEMENT_ID,
      type: MovementType.VENTA,
      productId: BDD_PRODUCT_ID,
      quantity: 5,
      userId: BDD_USER_ID,
      isAnnulled: false,
      annulledAt: null,
      annulledById: null,
      annulledReason: null,
    } as Movement;

    product = buildElectroterapiaProduct('Electrodo TENS', 45);
    queryRunner = createQueryRunnerMock(BDD_MOVEMENT_ID);

    (queryRunner.manager.findOne as jest.Mock).mockResolvedValue(product);
    (queryRunner.manager.save as jest.Mock).mockImplementation(
      async (_entity: unknown, data: Partial<Movement>) => {
        Object.assign(existingMovement, data);
        return { id: BDD_MOVEMENT_ID, ...existingMovement };
      },
    );
    (movementRepository.findById as jest.Mock).mockImplementation(async (id: string) => {
      if (id === BDD_MOVEMENT_ID) {
        return { ...existingMovement };
      }
      return null;
    });
    (getDataSource as jest.Mock).mockResolvedValue({
      createQueryRunner: () => queryRunner,
    });
  });

  test('Anulación de movimiento con soft delete', ({ given, and, when, then }) => {
    given(/^un movimiento de venta registrado y activo con cantidad (\d+)$/, (quantity) => {
      existingMovement.quantity = Number(quantity);
    });

    and(/^un producto con stock actual de (\d+) unidades$/, (stock) => {
      product.stock = Number(stock);
    });

    and('un administrador autenticado', () => {
      ctx.adminUserId = BDD_ADMIN_ID;
    });

    when(/^el administrador anula el movimiento con motivo "(.*)"$/, async (reason) => {
      ctx.annulReason = reason;
      ctx.annulledMovement = await movementService.annulMovement(BDD_MOVEMENT_ID, {
        reason,
        userId: ctx.adminUserId,
      });
    });

    then('el movimiento permanece en la base de datos', () => {
      expect(movementRepository.findById).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Movement,
        expect.objectContaining({ id: BDD_MOVEMENT_ID }),
      );
      expect(ctx.annulledMovement).not.toBeNull();
      expect(ctx.annulledMovement!.id).toBe(BDD_MOVEMENT_ID);
    });

    and('el estado del movimiento cambia a anulado', () => {
      expect(ctx.annulledMovement!.isAnnulled).toBe(true);
    });

    and('se registra el motivo y la fecha de anulación', () => {
      expect(ctx.annulledMovement!.annulledReason).toBe(ctx.annulReason);
      expect(ctx.annulledMovement!.annulledById).toBe(BDD_ADMIN_ID);
      expect(ctx.annulledMovement!.annulledAt).toBeInstanceOf(Date);
    });

    and(/^el stock del producto se revierte a (\d+) unidades$/, (expectedStock) => {
      expect(product.stock).toBe(Number(expectedStock));
    });
  });
});
