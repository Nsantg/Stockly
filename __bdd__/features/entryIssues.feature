# language: es
@entry-issues @almacen
Característica: Registro de incidencias en entradas de inventario
  Como almacenista
  Quiero registrar incidencias cuando recibo productos dañados o con cantidad faltante
  Para mantener trazabilidad de problemas en las entradas de mercancía

  Regla: Una incidencia queda en estado pendiente hasta ser resuelta

  @cp-entry-001 @producto-danado
  Escenario: Almacenista registra entrada con producto dañado
    Dado un almacenista autenticado en el sistema
    Y un producto "Electrodo TENS" con stock de 100 unidades
    Cuando registra una entrada de 50 unidades con observación "Caja dañada al llegar"
    Y marca 5 unidades como dañadas
    Entonces se genera una EntryIssue de tipo "DAMAGED" para "Electrodo TENS"
    Y la incidencia queda en estado pendiente
    Y la cantidad afectada es 5 unidades

  @cp-entry-002 @cantidad-faltante
  Escenario: Almacenista registra entrada con cantidad faltante
    Dado un almacenista autenticado en el sistema
    Y un producto "Jeringa 5ml" con stock de 200 unidades
    Cuando registra una entrada de 100 unidades declaradas
    Y reporta 10 unidades faltantes en la recepción
    Entonces se genera una EntryIssue de tipo "MISSING" para "Jeringa 5ml"
    Y la incidencia queda en estado pendiente
    Y la cantidad afectada es 10 unidades

  @cp-entry-003 @sin-incidencia
  Escenario: Almacenista registra entrada sin incidencias
    Dado un almacenista autenticado en el sistema
    Y un producto "Gasa Estéril" con stock de 500 unidades
    Cuando registra una entrada de 200 unidades sin observaciones de daño
    Entonces no se genera ninguna EntryIssue
    Y el stock del producto se incrementa en 200 unidades

  @cp-entry-004 @resolucion
  Escenario: Supervisor resuelve una incidencia pendiente
    Dado una EntryIssue de tipo "DAMAGED" en estado pendiente para "Electrodo TENS"
    Cuando el administrador marca la incidencia como resuelta
    Entonces la incidencia queda en estado resuelto
    Y se registra el movimiento de resolución asociado
