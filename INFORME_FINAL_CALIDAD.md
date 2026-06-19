# Informe Final de Calidad del MVP — Stockly

**Proyecto:** Nuclear 2026 (N2026) — Sistema de Gestión de Inventario y Logística Stockly  
**Entregable:** 3.er Corte — Calidad y Pruebas de Software  
**Versión del documento:** 1.0  
**Fecha de emisión:** 19 de junio de 2026  
**Elaborado por:** Equipo Nuclear 2026  
**Equipo:** Derly Elena Quejada Perea · Juan José Quintero · María Luisa Londoño Moncada · Nicolás Santiago Carmona · Xiomara Ocampo Hurtado · Juan Manuel Pinzón  

---

## Índice

1. [Métricas de Cobertura](#1-métricas-de-cobertura)
2. [Resumen de Defectos](#2-resumen-de-defectos)
3. [Resultados de Pruebas de Aceptación](#3-resultados-de-pruebas-de-aceptación)
4. [Dictamen de Calidad](#4-dictamen-de-calidad)
5. [Recomendaciones de Evolución](#5-recomendaciones-de-evolución)

---

## 1. Métricas de Cobertura

### 1.1 Contexto de la medición

La cobertura de código fue generada mediante Jest con Istanbul en su última ejecución registrada el 19 de junio de 2026 (`npm run test:coverage`). El reporte HTML interactivo se ubica en `coverage/index.html` y puede consultarse abriendo ese archivo en cualquier navegador.

La medición abarca las tres dimensiones estándar: **sentencias**, **ramas condicionales**, **funciones** y **líneas**, sobre los módulos del código fuente (`src/`) y las utilidades auxiliares de prueba (`__tests__/helpers`). El módulo `src/lib/cloudinary.ts` se excluye deliberadamente por tratarse de una integración de terceros sin lógica de negocio propia.

### 1.2 Resumen porcentual por módulo

| Módulo | Sentencias | Ramas | Funciones | Líneas | Clasificación |
|--------|-----------|-------|-----------|--------|---------------|
| `__tests__/helpers` | 100% (16/16) | 92.3% (12/13) | 100% (4/4) | 100% (16/16) | Alto |
| `src/controller` | 93.49% (460/492) | 88.84% (215/242) | 96.49% (55/57) | 93.52% (419/448) | Alto |
| `src/entity` | 93.54% (174/186) | 74.10% (83/112) | 25.00% (4/16) | 92.85% (156/168) | Medio-Alto |
| `src/lib` | 100% (73/73) | 92.10% (35/38) | 100% (9/9) | 100% (70/70) | Alto |
| `src/lib/realtime` | 63.04% (58/92) | 67.44% (29/43) | 44.44% (4/9) | 63.41% (52/82) | Medio |
| `src/repository` | 95.63% (219/229) | 95.38% (62/65) | 93.87% (92/98) | 96.77% (210/217) | Alto |
| `src/service` | 94.80% (420/443) | 90.26% (204/226) | 87.50% (63/72) | 94.67% (409/432) | Alto |
| `src/service/movement` | 100% (15/15) | 100% (2/2) | 100% (1/1) | 100% (15/15) | Alto |
| `src/service/movement/handlers` | 98.70% (153/155) | 87.87% (58/66) | 100% (20/20) | 100% (148/148) | Alto |

### 1.3 Cobertura global agregada (ponderada)

| Dimensión | Cubierto | Total | Porcentaje |
|-----------|---------|-------|------------|
| Sentencias | 1 588 | 1 701 | **93.35%** |
| Ramas | 700 | 807 | **86.74%** |
| Funciones | 252 | 286 | **88.11%** |
| Líneas | 1 495 | 1 596 | **93.67%** |

> **Interpretación:** El proyecto supera el umbral de calidad del 80% en sentencias y líneas recomendado por IEEE 829 para sistemas en etapa de MVP. Las ramas condicionales presentan la menor cobertura (86.74%), lo que es esperable dado que los flujos de excepción de bajo nivel (reconexiones de Socket.IO, rutas de error de entidades) no forman parte del alcance de prueba de este corte.

### 1.4 Módulos con cobertura de lógica de negocio crítica al 100%

Los siguientes módulos, que implementan las reglas de negocio más relevantes del sistema, alcanzaron cobertura total:

| Módulo | RN / CP cubiertos |
|--------|-------------------|
| `src/service/movement/` (orquestador) | RN-06, RF-07 |
| `src/service/movement/handlers/VentaHandler` | CP-10, CP-11, RN-06, RF-07, RF-08 |
| `src/service/movement/handlers/DevolucionHandler` | CP-15, CP-16, **RN-04** |
| `src/service/movement/handlers/AjusteSalidaHandler` | CP-18, RN-06 |
| `src/service/movement/MovementFactory` | Arquitectura de estrategias |
| `src/lib/auth.ts` (autenticación) | CP-31, **RNF-03** |
| `src/lib/permissions.ts` (RBAC) | CP-20, RF-16 |

---

## 2. Resumen de Defectos

### 2.1 Tabla consolidada de defectos

| ID | Descripción resumida | Severidad | Prioridad | CP / RF / RN | Estado | Sprint de resolución |
|----|----------------------|-----------|-----------|--------------|--------|----------------------|
| DEF-001 | Escalada de privilegios en POST /api/v1/users (sin autenticación ni control de rol) | **Crítica** | P0 | CP-19, CP-20, RF-16, RNF-03 | Resuelto | Sprint 3 |
| DEF-002 | Tests de autorización desactualizados tras refactor de `permissions.ts` | Baja | P2 | CP-20, RNF-03 | Resuelto | Sprint 3 |
| DEF-003 | FEFO implementado pero no conectado al handler de ventas | Media | P1 | N2026-4, RF-09 | Abierto | Backlog Sprint 4 |
| DEF-004 | Inconsistencia `isActive` / `isAnnulled` entre plan y entidad `Movement` | Baja | P3 | CP-05, CP-23, RNF-06 | Abierto | Mantenimiento |
| DEF-005 | `inventory.integration.test.ts` usa campos de DTO sin validación contra esquema Zod real | Baja | P3 | CP-01, RF-01 | Abierto | Mantenimiento |
| DEF-006 | Sin prueba de idempotencia en doble anulación (CP-06) | Media | P2 | CP-06, RNF-06 | Abierto | Backlog Sprint 4 |
| DEF-007 | Cobertura del 63% en `src/lib/realtime` — paths de reconexión Socket.IO sin prueba | Media | P2 | N2026-30, RF-22 | Abierto | Backlog Sprint 4 |

### 2.2 Distribución por severidad y estado

| Severidad | Total | Resueltos | Abiertos |
|-----------|-------|-----------|---------|
| Crítica | 1 | 1 (100%) | 0 |
| Alta | 0 | — | — |
| Media | 3 | 0 | 3 |
| Baja | 3 | 1 (33%) | 2 |
| **Total** | **7** | **2 (28.6%)** | **5 (71.4%)** |

> **Nota:** El único defecto de severidad Crítica (DEF-001) fue identificado y resuelto en el mismo sprint. Los defectos abiertos restantes son de severidad Media o Baja y no bloquean la operación del MVP. El equipo los ha priorizado para el Sprint 4.

### 2.3 Observaciones técnicas al equipo

**DEF-001 (Crítica — Resuelto):** Constituía el riesgo de seguridad más alto del ciclo. La ausencia de un guardia de autorización en el endpoint de usuarios habría permitido escalar privilegios sin autenticación, comprometiendo la regla RNF-03. La solución adoptada (`requireRoles([UserRole.ADMIN])`) es coherente con el patrón RBAC del sistema y fue verificada con tres pruebas de integración (401, 403, 201).

**DEF-003 (Media — Abierto):** La lógica FEFO está correctamente implementada en `InventoryService.getLotWithFefo()`. La brecha está en el acoplamiento con `VentaHandler`. Se recomienda inyectar el servicio de inventario dentro del handler para que la selección del lote correcto ocurra antes del descuento de stock, garantizando así el cumplimiento de la norma FEFO en cada despacho.

**DEF-006 y DEF-007 (Media — Abiertos):** Representan brechas de calidad que no bloquean el MVP pero que deben cerrarse antes de la siguiente iteración productiva, especialmente si el sistema se despliega en un entorno de carga real donde la idempotencia de anulaciones y la resiliencia del notificador en tiempo real son críticas.

---

## 3. Resultados de Pruebas de Aceptación

### 3.1 Contexto y metodología

Las pruebas de aceptación del MVP de Stockly fueron realizadas con la participación de estudiantes del programa de **Ingeniería Industrial** de la institución, quienes actuaron como usuarios finales representativos del perfil operativo del sistema. La sesión de validación tuvo lugar durante la semana del 9 al 13 de junio de 2026, en un entorno controlado de QA/Staging que replica las condiciones de la bodega de la empresa piloto.

Los participantes interactuaron con el sistema bajo los roles funcionales de **Operador de Bodega (Despachador)** y **Supervisor de Inventario (Administrador)**, ejecutando los flujos críticos definidos en el plan PT-DCP-01 y alineados con las historias del backlog N2026.

### 3.2 Criterios de aceptación evaluados

| ID | Criterio | RF / RN | Resultado |
|----|----------|---------|-----------|
| UAT-01 | El operador puede registrar una entrada de mercancía y verificar el incremento del stock en tiempo real | RF-05, RF-22 | Aceptado |
| UAT-02 | El sistema rechaza una venta cuando el stock disponible es insuficiente (RN-06) | RF-07, RF-09, **RN-06** | Aceptado |
| UAT-03 | El administrador puede crear, modificar y desactivar usuarios sin que el operador pueda hacerlo (control de roles) | RF-15, RF-16, **RNF-03** | Aceptado |
| UAT-04 | La devolución de un producto eléctrico se procesa correctamente; la devolución de un producto de masoterapia es rechazada por el sistema (**RN-04**) | RF-12, **RN-04** | Aceptado |
| UAT-05 | El reporte de movimientos refleja el historial completo con trazabilidad de anulaciones (soft delete — **RNF-06**) | RF-17, **RNF-06** | Aceptado |
| UAT-06 | El dashboard presenta los KPIs de inventario (stock crítico, alertas, rotación) de forma comprensible para personal no técnico | RF-22, N2026-30 | Aceptado |
| UAT-07 | El sistema genera el reporte PDF de movimientos con la marca de la empresa configurada | RF-23, N2026 | Aceptado |
| UAT-08 | El operador con rol Despachador no puede acceder a módulos administrativos (usuarios, configuración) | RF-16, RNF-03 | Aceptado |

**Resultado global: 8/8 criterios de aceptación superados (100%).**

### 3.3 Observaciones de los validadores (Ingeniería Industrial)

Los estudiantes de Ingeniería Industrial resaltaron los siguientes aspectos durante la sesión de validación:

1. **Rotación de inventario:** El flujo de registro de entradas y salidas fue considerado intuitivo y alineado con los procedimientos de bodega que conocen de sus materias de logística y cadena de suministro. Validaron que el sistema impide despachos sin stock suficiente, lo que en un contexto real evitaría errores de despacho manual.

2. **Trazabilidad y auditoría:** Los participantes comprobaron que los movimientos anulados permanecen en el historial con estado `ANULADO`, lo que permite auditorías retrospectivas. Indicaron que este comportamiento cumple con los estándares de control interno que aprenden en sus cursos de gestión de operaciones.

3. **Alertas de stock crítico:** El módulo de alertas en tiempo real fue evaluado positivamente. Los validadores lo compararon con los sistemas ERP que han estudiado (SAP, Oracle) y reconocieron su pertinencia para una operación de tamaño mediano.

4. **Oportunidades de mejora identificadas:** Los validadores sugirieron la posibilidad de exportar el inventario a Excel desde la interfaz (funcionalidad ya presente con la librería `xlsx`) y la visualización gráfica de la rotación por categoría.

### 3.4 Declaración de los participantes

> *"El sistema Stockly refleja los principios de control de inventario que hemos estudiado en logística y gestión de operaciones. La restricción de devoluciones solo para productos eléctricos (RN-04) y el bloqueo de ventas sin stock (RN-06) son exactamente los controles que un sistema de bodega real debe tener. Lo validamos y consideramos que el MVP cumple con los requisitos operativos básicos."*  
> — **Estudiantes de Ingeniería Industrial, validación UAT, junio de 2026**

---

## 4. Dictamen de Calidad

### 4.1 Declaración formal

Con base en los resultados de las pruebas automatizadas (unitarias, BDD e integración), el reporte de cobertura de código, la evaluación de defectos y las pruebas de aceptación realizadas con usuarios del dominio operativo, el equipo de QA del Proyecto Nuclear 2026 emite el siguiente dictamen:

---

> **El producto mínimo viable (MVP) de Stockly se declara APTO para entrar en operación controlada** en el entorno de la empresa piloto, bajo las condiciones y restricciones que se detallan a continuación.

---

### 4.2 Fundamentos del dictamen

| Criterio | Resultado | Umbral requerido | Estado |
|----------|-----------|-----------------|--------|
| Cobertura de sentencias | 93.35% | >= 80% | Cumple |
| Cobertura de líneas | 93.67% | >= 80% | Cumple |
| Cobertura de funciones | 88.11% | >= 80% | Cumple |
| Defectos críticos abiertos | 0 | 0 | Cumple |
| Criterios UAT superados | 8/8 (100%) | >= 90% | Cumple |
| Reglas de negocio cubiertas (RN-04, RN-06, RNF-06) | 100% automatizadas | 100% | Cumple |
| Pruebas de integración con BD real | 7 casos, 100% verde | >= 90% | Cumple |
| Defectos de severidad alta/crítica abiertos | 0 | 0 | Cumple |

### 4.3 Condiciones de operación controlada

El MVP entra en operación bajo las siguientes restricciones, derivadas de los defectos abiertos de severidad media:

1. **DEF-003 (FEFO no acoplado):** En la fase inicial de operación, el despacho no respetará automáticamente la rotación por fecha de vencimiento. El operador deberá verificar manualmente el lote a despachar hasta que DEF-003 sea resuelto en el Sprint 4.

2. **DEF-006 (Doble anulación):** Se recomienda establecer un procedimiento operativo estándar (SOP) que indique que solo se anule un movimiento una vez, hasta que la idempotencia sea validada por prueba automatizada.

3. **DEF-007 (Resiliencia Socket.IO):** El módulo de alertas en tiempo real puede mostrar comportamiento inesperado ante reconexiones de red. Se recomienda monitorear el log del servidor durante las primeras semanas de operación.

### 4.4 Cumplimiento de reglas de negocio clave

| Regla | Descripción | Verificación |
|-------|-------------|-------------|
| **RN-04** | Las devoluciones solo se permiten para productos de la categoría eléctrica (con número de serie habilitado) | Cubierta al 100% por `DevolucionHandler.test.ts` (CP-15, CP-16) y escenario BDD `devoluciones.feature` |
| **RN-06** | El stock de un producto nunca puede quedar en valor negativo | Cubierta al 100% por `VentaHandler.test.ts`, `AjusteSalidaHandler.test.ts` y prueba de integración POST /api/v1/movements |
| **RNF-06** | Los registros de usuarios y movimientos eliminados deben conservarse mediante soft delete (trazabilidad) | Cubierta por `trazabilidad.feature` (BDD), prueba de integración PATCH .../annul y prueba de auth con usuario inactivo |

---

## 5. Recomendaciones de Evolución

Las siguientes recomendaciones técnicas están orientadas a la evolución del sistema Stockly más allá del MVP, preparando la plataforma para escenarios de mayor volumen, disponibilidad y mantenibilidad. Se proponen para el roadmap del 4.o corte o para la fase de producción del proyecto.

---

### Recomendación 1: Migración a servicios en la nube con infraestructura como código (IaC)

**Contexto:** El MVP de Stockly se despliega actualmente mediante contenedores Docker gestionados manualmente (ver `docker-compose.yml` y `render.yaml`). A medida que la base de usuarios crezca y se incorporen nuevas empresas piloto, la gestión manual de la infraestructura se convierte en un cuello de botella operativo y un riesgo de disponibilidad.

**Recomendación:** Migrar el despliegue a un proveedor de nube (AWS, Google Cloud o Azure) usando infraestructura como código con **Terraform** o **AWS CDK**. Específicamente se recomienda:

- **Base de datos:** Migrar de PostgreSQL en contenedor a **Amazon RDS** o **Cloud SQL (GCP)** con réplicas de lectura y backups automáticos. Esto resuelve el riesgo de pérdida de datos y mejora la disponibilidad (SLA ≥ 99.9%).
- **Aplicación:** Desplegar el servidor Next.js en **AWS ECS con Fargate** o **Cloud Run (GCP)**, lo que permite escalar horizontalmente sin gestionar servidores.
- **Variables de entorno y secretos:** Migrar de archivos `.env` a **AWS Secrets Manager** o **Google Secret Manager**, eliminando el riesgo de exposición accidental de credenciales.

**Impacto esperado:** Reducción del tiempo de inactividad no planificado, escalabilidad automática ante picos de carga (verificados en las pruebas K6) y cumplimiento de estándares de seguridad de datos en la nube.

---

### Recomendación 2: Optimización de consultas y estrategia de caché en base de datos

**Contexto:** Las pruebas de rendimiento con K6 evidencian que los endpoints de Dashboard (`GET /api/v1/dashboard`) e Inventario (`GET /api/v1/inventory`) son los de mayor carga bajo concurrencia de 50 usuarios. Estos endpoints ejecutan consultas agregadas sobre tablas que crecerán con el uso (movimientos, lotes, alertas). Sin optimización, la latencia puede superar el umbral del 95th percentil (2 000 ms) en producción real.

**Recomendación:** Implementar una estrategia en tres capas:

1. **Índices en columnas críticas:** Agregar índices sobre `productId`, `createdAt`, `isAnnulled` en la tabla `movements`, y sobre `categoryId`, `isActive` en `products`. TypeORM permite declararlos con el decorador `@Index()` en las entidades.

2. **Caché de consultas con Redis:** Implementar una capa de caché con **Redis** para los endpoints de solo lectura del Dashboard (TTL de 30 segundos). La librería `ioredis` es compatible con el stack Node.js actual. Las consultas cacheadas pasarían de ~800 ms a < 10 ms en el percentil 50.

3. **Paginación y proyecciones en ORM:** Reemplazar los `find()` sin límite por `findAndCount()` con paginación explícita en todos los listados. Esto ya está parcialmente implementado en los endpoints de movimientos, pero debe extenderse a inventario y alertas.

**Impacto esperado:** Reducción del tiempo de respuesta del Dashboard en un 60-80% bajo carga concurrente, y eliminación de consultas N+1 identificadas en el análisis de cobertura de repositorios.

---

### Recomendación 3: Modularización y escalabilidad del sistema de reportes

**Contexto:** El módulo de generación de reportes PDF (`jspdf`, `jspdf-autotable`) está acoplado directamente a los controladores. Esto dificulta agregar nuevos formatos de reporte (Excel avanzado, CSV, reportes programados por correo) y genera controladores con múltiples responsabilidades, lo que viola el principio de responsabilidad única (SRP).

**Recomendación:** Escalar el sistema de reportes mediante tres mejoras arquitectónicas:

1. **Servicio de reportes dedicado:** Extraer la lógica de generación de PDF/Excel a un `ReportService` independiente, con una interfaz común (`IReportGenerator`) que permita intercambiar el motor de renderizado sin modificar los controladores. Esto sigue el patrón Strategy ya usado en los handlers de movimientos.

2. **Procesamiento asíncrono con colas de trabajo:** Para reportes de gran volumen (histórico de movimientos anual, cierre de mes), implementar un sistema de colas con **BullMQ** (Redis) o **AWS SQS**. El usuario solicitaría el reporte, recibiría una notificación (ya integrada con Socket.IO) cuando esté listo, y lo descargaría desde un enlace temporal.

3. **Reportes programados:** Implementar un scheduler con **node-cron** o **AWS EventBridge** que genere y envíe automáticamente el resumen semanal de inventario por correo electrónico a los supervisores, usando **Nodemailer** o el servicio **AWS SES**. Esto incrementa el valor percibido del sistema para los usuarios operativos sin requerir interacción manual.

**Impacto esperado:** Los controladores reducen su complejidad ciclomática, la cobertura del módulo de reportes puede alcanzar el 90%+ con pruebas unitarias del servicio aislado, y el sistema puede atender solicitudes de reporte de grandes volúmenes sin bloquear el hilo principal.

---

## Anexos

### Anexo A: Historial de ejecuciones de pruebas automatizadas

| Fecha | Suite | Comando | Resultado | Observaciones |
|-------|-------|---------|-----------|---------------|
| 2026-06-07 | Integración API | `npm run test:integration` | 7/7 pasaron | PostgreSQL `stockly_test`, Supertest |
| 2026-06-07 | BDD | `npm run test:bdd` | 5/5 pasaron | Gherkin en español, jest-cucumber |
| 2026-06-07 | Unitarias | `npm test` | 59/59 pasaron | Sin conexión a BD |
| 2026-06-15 | Unitarias | `npm test` | 73/73 pasaron | Nuevas pruebas de seguridad, controladores y repositorios |
| 2026-06-19 | Unitarias + cobertura | `npm run test:coverage` | Todos pasan | Cobertura global ≥ 93% en sentencias y líneas |

### Anexo B: Referencia a documentos del proyecto

| Documento | Ubicación |
|-----------|-----------|
| Plan de pruebas oficial | `__tests__/PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf` |
| Documentación suite técnica | `__tests__/DOCUMENTACION-PRUEBAS.md` |
| Matriz de trazabilidad y defectos | `__tests__/TRAZABILIDAD-Y-REPORTES-QA.md` |
| Documentación suite BDD | `__bdd__/DOCUMENTACION-PRUEBAS-BDD.md` |
| Documentación integración API | `__tests__/integration/DOCUMENTACION-PRUEBAS-INTEGRACION.md` |
| Reporte HTML de cobertura | `coverage/index.html` |
| Script de pruebas de rendimiento K6 | `performance-k6.js` |
| Configuración Jest | `jest.config.js` |

### Anexo C: Configuración del reporte de cobertura

La configuración de `jest.config.js` genera los siguientes formatos de reporte en cada ejecución de `npm run test:coverage`:

- **HTML interactivo** → `coverage/index.html` (navegable, con desglose por archivo y línea)
- **LCOV** → `coverage/lcov.info` (compatible con SonarQube, Codecov, Coveralls)
- **JSON Summary** → `coverage/coverage-summary.json` (integrable con CI/CD pipelines)
- **Texto** → salida estándar en terminal al ejecutar el comando

```bash
# Generar reporte completo de cobertura
npm run test:coverage

# El reporte HTML queda disponible en:
# coverage/index.html
```

---

*Documento elaborado por el Equipo Nuclear 2026 — Proyecto Stockly.*  
*Fecha: 19 de junio de 2026 | Versión: 1.0*
