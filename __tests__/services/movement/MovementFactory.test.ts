import { MovementFactory } from '../../../src/service/movement/MovementFactory';
import { MovementType } from '../../../src/entity/MovementType';
import { VentaHandler } from '../../../src/service/movement/handlers/VentaHandler';
import { DevolucionHandler } from '../../../src/service/movement/handlers/DevolucionHandler';
import { AjusteSalidaHandler } from '../../../src/service/movement/handlers/AjusteSalidaHandler';

describe('MovementFactory - Inyección de estrategias por tipo', () => {
  it('debe retornar VentaHandler para movimientos tipo VENTA', () => {
    const handler = MovementFactory.getHandler(MovementType.VENTA);
    expect(handler).toBeInstanceOf(VentaHandler);
  });

  it('debe retornar DevolucionHandler para movimientos tipo DEVOLUCION', () => {
    const handler = MovementFactory.getHandler(MovementType.DEVOLUCION);
    expect(handler).toBeInstanceOf(DevolucionHandler);
  });

  it('debe retornar AjusteSalidaHandler para movimientos tipo AJUSTE_SALIDA', () => {
    const handler = MovementFactory.getHandler(MovementType.AJUSTE_SALIDA);
    expect(handler).toBeInstanceOf(AjusteSalidaHandler);
  });

  it('debe lanzar error para un tipo de movimiento no registrado', () => {
    expect(() => MovementFactory.getHandler('INVALIDO' as MovementType)).toThrow(
      'Tipo de movimiento no válido: INVALIDO',
    );
  });
});
