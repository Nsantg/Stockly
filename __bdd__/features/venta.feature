# language: es
@venta @logistica
Característica: Despacho de venta
  Como operador logístico
  Quiero registrar despachos de venta
  Para mantener el inventario actualizado sin permitir stock negativo

  Regla: El stock nunca puede ser negativo

  @cp-10 @despacho-exitoso
  Escenario: Despacho exitoso que descuenta stock
    Dado un producto "Electrodo TENS" con stock disponible de 50 unidades
    Y un cliente registrado para venta al detalle
    Cuando registro un despacho de venta por 5 unidades
    Entonces el despacho se registra exitosamente
    Y el stock del producto queda en 45 unidades

  @cp-11 @stock-insuficiente
  Escenario: Despacho rechazado por stock insuficiente
    Dado un producto "Electrodo TENS" con stock disponible de 3 unidades
    Y un cliente registrado para venta al detalle
    Cuando intento registrar un despacho de venta por 10 unidades
    Entonces el sistema rechaza la operación
    Y el mensaje indica stock insuficiente
    Y el stock del producto permanece en 3 unidades
