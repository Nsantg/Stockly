# language: es
@devolucion @logistica
Característica: Devolución de productos
  Como operador de atención al cliente
  Quiero registrar devoluciones de productos
  Para controlar el reingreso al inventario según la categoría del producto

  Regla: Solo se aceptan devoluciones de productos eléctricos (Electroterapia)

  @cp-15 @devolucion-aceptada
  Escenario: Devolución aceptada para producto de Electroterapia
    Dado un producto eléctrico "Electroestimulador Pro" de la categoría "Electroterapia" con stock de 10 unidades
    Y un cliente que desea devolver el producto
    Cuando el cliente registra una devolución por causa "Producto defectuoso"
    Entonces la devolución se acepta
    Y el stock del producto aumenta a 11 unidades

  @cp-16 @devolucion-rechazada
  Escenario: Devolución rechazada para producto no eléctrico
    Dado un producto "Aceite masaje" de la categoría "Masoterapia" sin número de serie
    Y un cliente que desea devolver el producto
    Cuando el cliente intenta registrar una devolución por causa "Cliente insatisfecho"
    Entonces el sistema rechaza la devolución
    Y el mensaje indica que solo se permiten productos eléctricos
    Y el stock del producto permanece sin cambios
