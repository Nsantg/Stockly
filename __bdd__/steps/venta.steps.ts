import path from 'path';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { VentaHandler } from '@/service/movement/handlers/VentaHandler';
import { createEmptyContext, ScenarioContext } from '../support/context/ScenarioContext';
import { buildElectroterapiaProduct } from '../support/helpers/productFactory';
import { buildVentaDto } from '../support/helpers/movementDtoFactory';
import { createQueryRunnerMock } from '../support/helpers/queryRunnerMock';

const feature = loadFeature(path.join(__dirname, '../features/venta.feature'));

defineFeature(feature, (test) => {
  let ctx: ScenarioContext;
  const handler = new VentaHandler();

  beforeEach(() => {
    ctx = createEmptyContext();
    ctx.queryRunner = createQueryRunnerMock();
  });

  test('Despacho exitoso que descuenta stock', ({ given, and, when, then }) => {
    given(/^un producto "(.*)" con stock disponible de (\d+) unidades$/, (name, stock) => {
      ctx.product = buildElectroterapiaProduct(name, Number(stock));
    });

    and('un cliente registrado para venta al detalle', () => {
      ctx.movementDto = buildVentaDto(5);
    });

    when(/^registro un despacho de venta por (\d+) unidades$/, async (quantity) => {
      ctx.movementDto = buildVentaDto(Number(quantity));
      await handler.validate(ctx.movementDto, ctx.product);
      ctx.movement = await handler.execute(ctx.movementDto, ctx.product, ctx.queryRunner);
    });

    then('el despacho se registra exitosamente', () => {
      expect(ctx.error).toBeNull();
      expect(ctx.movement).not.toBeNull();
      expect(ctx.movement!.clientId).toBeTruthy();
    });

    and(/^el stock del producto queda en (\d+) unidades$/, (expectedStock) => {
      expect(ctx.product.stock).toBe(Number(expectedStock));
    });
  });

  test('Despacho rechazado por stock insuficiente', ({ given, and, when, then }) => {
    given(/^un producto "(.*)" con stock disponible de (\d+) unidades$/, (name, stock) => {
      ctx.product = buildElectroterapiaProduct(name, Number(stock));
    });

    and('un cliente registrado para venta al detalle', () => {
      ctx.movementDto = buildVentaDto(10);
    });

    when(/^intento registrar un despacho de venta por (\d+) unidades$/, async (quantity) => {
      ctx.movementDto = buildVentaDto(Number(quantity));
      try {
        await handler.validate(ctx.movementDto, ctx.product);
        await handler.execute(ctx.movementDto, ctx.product, ctx.queryRunner);
      } catch (error) {
        ctx.error = error as Error;
      }
    });

    then('el sistema rechaza la operación', () => {
      expect(ctx.error).not.toBeNull();
      expect(ctx.movement).toBeNull();
    });

    and('el mensaje indica stock insuficiente', () => {
      expect(ctx.error!.message).toMatch(/Stock insuficiente/i);
    });

    and(/^el stock del producto permanece en (\d+) unidades$/, (expectedStock) => {
      expect(ctx.product.stock).toBe(Number(expectedStock));
    });
  });
});
