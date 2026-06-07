# language: es
@trazabilidad @logistica
Característica: Trazabilidad de movimientos
  Como administrador del sistema
  Quiero anular movimientos registrados
  Para mantener la trazabilidad histórica sin eliminar registros de la base de datos

  Regla: La anulación es un soft delete; el registro persiste con estado anulado

  @cp-anulacion @soft-delete
  Escenario: Anulación de movimiento con soft delete
    Dado un movimiento de venta registrado y activo con cantidad 5
    Y un producto con stock actual de 45 unidades
    Y un administrador autenticado
    Cuando el administrador anula el movimiento con motivo "Error de registro duplicado"
    Entonces el movimiento permanece en la base de datos
    Y el estado del movimiento cambia a anulado
    Y se registra el motivo y la fecha de anulación
    Y el stock del producto se revierte a 50 unidades
