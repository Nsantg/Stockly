import path from 'path';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { DevolucionHandler } from '@/service/movement/handlers/DevolucionHandler';
import { createEmptyContext, ScenarioContext } from '../support/context/ScenarioContext';
import {
  buildElectroterapiaProduct,
  buildNonElectricProduct,
} from '../support/helpers/productFactory';
import { buildDevolucionDto } from '../support/helpers/movementDtoFactory';
import { createQueryRunnerMock } from '../support/helpers/queryRunnerMock';

const feature = loadFeature(path.join(__dirname, '../features/devoluciones.feature'));

defineFeature(feature, (test) => {
  let ctx: ScenarioContext;
  const handler = new DevolucionHandler();
  const initialStockRef = { value: 0 };

  beforeEach(() => {
    ctx = createEmptyContext();
    ctx.queryRunner = createQueryRunnerMock();
    initialStockRef.value = 0;
  });

  test('Devolución aceptada para producto de Electroterapia', ({ given, and, when, then }) => {
    given(
      /^un producto eléctrico "(.*)" de la categoría "(.*)" con stock de (\d+) unidades$/,
      (name, _category, stock) => {
        ctx.product = buildElectroterapiaProduct(name, Number(stock));
        initialStockRef.value = ctx.product.stock;
      },
    );

    and('un cliente que desea devolver el producto', () => {
      ctx.movementDto = buildDevolucionDto('Producto defectuoso');
    });

    when(/^el cliente registra una devolución por causa "(.*)"$/, async (cause) => {
      ctx.movementDto = buildDevolucionDto(cause);
      await handler.validate(ctx.movementDto, ctx.product);
      ctx.movement = await handler.execute(ctx.movementDto, ctx.product, ctx.queryRunner);
    });

    then('la devolución se acepta', () => {
      expect(ctx.error).toBeNull();
      expect(ctx.movement).not.toBeNull();
      expect(ctx.movement!.returnCause).toBe('Producto defectuoso');
    });

    and(/^el stock del producto aumenta a (\d+) unidades$/, (expectedStock) => {
      expect(ctx.product.stock).toBe(Number(expectedStock));
      expect(ctx.product.stock).toBeGreaterThan(initialStockRef.value);
    });
  });

  test('Devolución rechazada para producto no eléctrico', ({ given, and, when, then }) => {
    given(
      /^un producto "(.*)" de la categoría "(.*)" sin número de serie$/,
      (name, _category) => {
        ctx.product = buildNonElectricProduct(name, 20);
        initialStockRef.value = ctx.product.stock;
      },
    );

    and('un cliente que desea devolver el producto', () => {
      ctx.movementDto = buildDevolucionDto('Cliente insatisfecho');
    });

    when(/^el cliente intenta registrar una devolución por causa "(.*)"$/, async (cause) => {
      ctx.movementDto = buildDevolucionDto(cause);
      try {
        await handler.validate(ctx.movementDto, ctx.product);
        await handler.execute(ctx.movementDto, ctx.product, ctx.queryRunner);
      } catch (error) {
        ctx.error = error as Error;
      }
    });

    then('el sistema rechaza la devolución', () => {
      expect(ctx.error).not.toBeNull();
      expect(ctx.movement).toBeNull();
    });

    and('el mensaje indica que solo se permiten productos eléctricos', () => {
      expect(ctx.error!.message).toMatch(/productos eléctricos/i);
    });

    and('el stock del producto permanece sin cambios', () => {
      expect(ctx.product.stock).toBe(initialStockRef.value);
    });
  });
});
