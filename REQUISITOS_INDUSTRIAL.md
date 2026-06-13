# Requisitos y Reglas de Negocio — Proyecto Nuclear Stockly
**Asignatura Interdisciplinar:** Integración Ingeniería de Software e Ingeniería Industrial  
**Caso de Estudio Real:** Import Corporal Med S.A.  
**Ciclo Académico:** 5to Semestre — Universidad Alexander von Humboldt  
**Enlace de Gestión de Requisitos:** [Backlog Jira N2026](https://stly.atlassian.net/jira/software/projects/N2026/boards/34/backlog)

---

## Alcance del Sistema
La aplicación web permitirá gestionar de manera centralizada el inventario y la trazabilidad logística de una empresa de insumos médicos orientados a la fisioterapia (Import Corporal Med S.A.), mitigando de manera directa los **errores recurrentes en despachos** y el **descontrol de existencias físicas**. El sistema controla de forma estricta:
* Flujos de entradas y salidas de mercancía.
* Control del stock físico e integrado en tiempo real.
* Gestión segura de usuarios y perfiles basada en roles operativos.
* Catálogo de clientes concurrentes.
* Notificaciones automatizadas de alertas críticas (vencimiento de lotes y quiebre de stock mínimo).

---

## Módulos y Requisitos Funcionales (RF)

### 1. Módulo de Inventario
* **RF-01: Registro de productos:** Permite el alta de insumos médicos capturando: Código único, Código de barras, Código serial (Obligatorio únicamente si la categoría pertenece a *Electroterapia*), Nombre comercial, Peso volumétrico, Categoría, Subcategoría, Indicador de requerimiento de refrigeración (Sí/No), Fecha de vencimiento, Stock inicial y Stock mínimo de seguridad.
* **RF-02: Consulta de inventario:** Visualización dinámica del stock actual por producto de forma individual y el inventario total consolidado de la organización.
* **RF-03: Filtrado de productos:** Capacidad de segmentar el catálogo de insumos por categorías y subcategorías logísticas.
* **RF-04: Búsqueda de productos:** Localización ágil indexada por código o nombre del insumo, implementando una correspondencia bidireccional mediante autocompletado automatizado (`Código ↔ Nombre`).

### 2. Módulo de Entradas
* **RF-05: Registro de entrada:** Persistencia de ingresos de mercancía asociando: Producto, Cantidad, Usuario operador, Detalle descriptivo, Proveedor y Ubicación física (asignando por defecto *Bodega*). El sistema incrementará el stock de manera automática.
  * *Nota de Inmutabilidad:* Queda prohibido el borrado físico de registros de entrada. En su lugar, se implementará la acción de "Anular", revirtiendo el impacto en el stock pero reteniendo la auditoría histórica.
* **RF-06: Validación de entrada:** Interfaz para el registro obligatorio de observaciones cualitativas y cuantitativas en caso de detectar un producto dañado o cantidades discrepantes frente a la factura del proveedor.

### 3. Módulo de Salidas
* **RF-07: Registro de salidas generales:** Control de egresos del centro de distribución registrando: Producto, Cantidad, Tipo de salida (*Venta, Daño, Vencimiento o Devolución*), Usuario operador y Ubicación de origen (*Bodega* o *Vitrina*). El sistema restará automáticamente las existencias globales.
  * *Nota de Inmutabilidad:* Los movimientos de salida anulados deben revertir su efecto en el inventario y mantener el registro histórico inalterado.
* **RF-08: Registro de despacho (Venta):** Cuando la salida se tipifique estrictamente como *Venta*, se exigirá de forma obligatoria asociar el Cliente, Tipo de cliente (*Detal* o *Mayorista*) y calcular el Peso total de la carga para la gestión del transporte.
* **RF-09: Control de stock absoluto:** Mecanismo de control que bloquea cualquier intento de salida si el inventario disponible del insumo es insuficiente.
* **RF-10: Edición restrictiva de despachos:** Un despacho solo podrá editarse si el usuario posee el rol de *Almacenista* o *Admin*, y la acción se realiza estrictamente dentro del mismo turno operativo en el que se consolidó la operación (`7:00 AM - 2:00 PM` o `2:00 PM - 5:00 PM`).
* **RF-11: Traslado interno a vitrina:** Permite mover mercancía física desde la ubicación de *Bodega* hacia *Vitrina* para exhibición, modificando la ubicación interna del stock sin alterar el balance de unidades totales del sistema corporativo.

### 4. Módulo de Devoluciones
* **RF-12: Devolución de cliente:** Proceso para reincorporar productos vendidos al inventario. Registra de forma obligatoria: Producto, Causa, Descripción detallada, Cantidad, Cliente afectado y Usuario procesador.
  * *Restricción de Categoría:* Solo se aceptan devoluciones de insumos clasificados bajo la categoría de equipos eléctricos (*Electroterapia*).

### 5. Módulo de Ajustes
* **RF-13: Ajuste de inventario:** Herramienta administrativa para conciliar y corregir discrepancias directas encontradas entre el inventario físico real y las existencias computadas en el sistema.
* **RF-14: Registro de ajuste:** Almacena de manera obligatoria para fines de auditoría: Usuario responsable, Motivo justificado del ajuste, Cantidad neta ajustada y el Tipo de impacto (*Ingreso* o *Salida*).

### 6. Módulo de Usuarios y Seguridad
* **RF-15: Gestión de usuarios:** Registro básico de personal administrativo y operativo almacenando su Nombre completo y Rol asignado.
* **RF-16: Control de accesos basado en Roles:** El sistema restringirá las vistas y operaciones según los siguientes perfiles:
  * **Admin:** Acceso total sin restricciones al sistema, configuraciones y usuarios.
  * **Almacenista:** Acceso total a la operación logística de inventarios.
  * **Despachador:** Acceso restringido exclusivamente a los flujos transaccionales de Entradas y Salidas.
  * **Visualizador:** Acceso de lectura en todo el ecosistema (Dashboard y listados) sin permisos de escritura ni alteración de datos.

### 7. Módulo de Auditoría
* **RF-17: Registro automatizado de movimientos:** Captura de eventos en segundo plano para cada alteración del inventario, guardando: Tipo de movimiento, Producto, Cantidad, Usuario ejecutor, Fecha/Hora exacta y Detalle técnico.
* **RF-18: Consulta de auditoría:** Filtros avanzados para examinar el historial de auditoría segmentado por Usuario específico o por Producto.

### 8. Módulo de Clientes
* **RF-19: Registro de clientes:** Base de datos para el alta de compradores almacenando: Nombre o Razón Social, Teléfono de contacto y Dirección de despacho.
* **RF-20: Uso obligatorio de clientes:** Vinculación restrictiva de un cliente válido por cada operación tipificada como despacho por venta.

### 9. Módulo de Indicadores y Alertas
* **RF-21: Dashboard Gerencial:** Panel analítico de Inteligencia de Negocios que expone: Cantidad total de productos despachados, Número bruto de despachos, Entradas procesadas en una ventana de tiempo, Cliente recurrente con mayor volumen de compras, Producto con máxima existencia, Producto en estado crítico de desabastecimiento, Porcentaje general de productos con stock activo y el Índice de rotación de productos.
* **RF-22: Alerta de vencimiento predictiva:** Notificación visual preventiva de productos cuyas fechas de vencimiento de lotes se encuentran próximas a cumplirse.
* **RF-23: Alerta de refrigeración:** Advertencia visual obligatoria al momento de registrar un producto si este requiere de condiciones de refrigeración especiales para asegurar la cadena de frío.

---

## Requisitos No Funcionales (RNF)
* **RNF-01: Usabilidad:** Interfaz intuitiva, ágil y de rápida curva de aprendizaje para minimizar errores humanos en el registro bajo entornos de alta operación logística.
* **RNF-02: Rendimiento:** Consulta y actualización del estado del inventario calculada en tiempo real.
* **RNF-03: Seguridad:** Control estricto de autenticación de identidad y restricción rígida de endpoints basada en los privilegios del rol del usuario firmado.
* **RNF-04: Disponibilidad:** Garantía de operación continua del sistema durante la totalidad de la jornada laboral de la distribuidora médica.
* **RNF-05: Escalabilidad:** Arquitectura de software preparada para soportar el crecimiento orgánico en volumen de productos y transacciones concurrentes sin degradación de los tiempos de respuesta.
* **RNF-06: Trazabilidad inmutable:** Registro persistente e histórico de la totalidad de las operaciones del almacén.

---

## Reglas de Negocio Críticas (RN)
* **RN-01:** La unidad de medida de gestión absoluta para todos los insumos médicos se expresa en *Unidades*.
* **RN-02:** El sistema no contempla integraciones de cara al usuario con proveedores externos, cotizaciones ni emisión de Órdenes de Compra (módulos fuera del alcance).
* **RN-03:** No se gestionan posiciones tridimensionales complejas (racks, estanterías, pasillos). El stock se ubica binariamente en **"Bodega"** o **"Vitrina"**.
* **RN-04:** Restricción estricta de calidad: Únicamente los insumos médicos de la categoría de equipos eléctricos (*Electroterapia*) están habilitados para procesar devoluciones en el sistema.
* **RN-05:** Los únicos flujos de salida permitidos y parametrizados son: *Venta, Daño, Vencimiento y Devolución*.
* **RN-06 (Regla de Oro):** Bajo ninguna circunstancia operativa o transaccional el stock de un producto podrá tomar valores menores a cero (`Stock >= 0`).

---

## Supuestos y Restricciones de Ingeniería
* La solución será desplegada exclusivamente como una aplicación web adaptativa.
* No se incluye analítica avanzada para la predicción de la demanda de insumos ni ruteo logístico avanzado.
* Para el alcance de este ciclo, los datos de usuario recopilados se limitan estrictamente a Nombre y Apellido para mantener el modelo ágil.