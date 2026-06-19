# Documentación de pruebas — Stockly

**Proyecto:** Nuclear 2026 (N2026), gestor de inventario Stockly  
**Asignatura:** Pruebas de Software | Arquitectura de Software | Programación con tecnologías web  
**Plan de referencia:** `PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf`  
**Última ejecución registrada:** 15 de junio de 2026 — unitarias: 73 pasaron; BDD: 5 escenarios; integración: 7 pruebas (PostgreSQL)

---

## Tres suites de prueba en el proyecto

Stockly tiene **tres carpetas/configuraciones** de pruebas automatizadas:

| Suite | Carpeta / config | Comando | Enfoque | BD real |
|-------|------------------|---------|---------|---------|
| **Técnica (unitarias)** | `__tests__/` · `jest.config.js` | `npm test` | Jest, mocks, handlers y servicios | No |
| **BDD** | `__bdd__/` · `jest.bdd.config.js` | `npm run test:bdd` | Gherkin en español (jest-cucumber) | No |
| **Integración API** | `__tests__/integration/` · `jest.integration.config.js` | `npm run test:integration` | Supertest + PostgreSQL `stockly_test` | Sí |

La integración está **excluida** de `npm test` (`testPathIgnorePatterns`) para no exigir PostgreSQL al correr unitarias. Documentación:

- BDD: `__bdd__/DOCUMENTACION-PRUEBAS-BDD.md`
- Integración: `__tests__/integration/DOCUMENTACION-PRUEBAS-INTEGRACION.md`

---

## Para qué sirve esta carpeta

Aquí vive todo lo relacionado con las pruebas automatizadas de Stockly. El objetivo es comprobar, sin depender de PostgreSQL en las pruebas unitarias, que las reglas de negocio importantes se cumplen: devoluciones solo en productos eléctricos (RN-04), stock nunca negativo (RN-06), trazabilidad por soft delete (RNF-06), entre otras.

Cada prueba está pensada para alinearse con el plan PT-DCP-01 y con las historias del backlog N2026.

---

## Herramientas que usamos

| Herramienta | Para qué la usamos |
|-------------|-------------------|
| Jest | Ejecutar pruebas, hacer aserciones, generar mocks y medir cobertura |
| ts-jest | Compilar TypeScript al correr los tests |
| jest.mock() | Aislar repositorios TypeORM, bcryptjs, next-auth y servicios externos |
| Zod | Validar DTOs; cuando falla, verificamos que se lance ZodError |
| NextRequest | Simular peticiones HTTP en pruebas de controladores |
| Supertest | Instalado y listo para pruebas E2E HTTP más adelante |

La configuración está en `jest.config.js`, en la raíz del proyecto:

```javascript
preset: 'ts-jest'
testEnvironment: 'node'
testMatch: ['**/__tests__/**/*.test.ts']
moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }
collectCoverage: true
coverageDirectory: 'coverage'
```

---

## Cómo está organizada la carpeta

```
__tests__/
├── DOCUMENTACION-PRUEBAS.md          (este documento)
├── TRAZABILIDAD-Y-REPORTES-QA.md     (matriz RF/CP, fallos y defectos)
├── PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf
│
├── helpers/
│   └── movementTestHelpers.ts        factories de Product, DTO y QueryRunner mock
│
├── services/                         pruebas unitarias de lógica pura
│   ├── movement/
│   │   ├── VentaHandler.test.ts
│   │   ├── DevolucionHandler.test.ts
│   │   ├── AjusteSalidaHandler.test.ts
│   │   ├── OtherHandlers.test.ts     Entrada, Daño, Vencimiento, Ajuste ingreso, Traslado
│   │   └── MovementFactory.test.ts
│   ├── InventoryService.test.ts
│   ├── UserService.test.ts
│   └── MovementService.test.ts
│
├── lib/                              integración ligera de lib y controladores (mocks)
│   ├── auth.test.ts
│   └── inventory.integration.test.ts
│
├── integration/                      integración API + PostgreSQL (Supertest)
│   ├── DOCUMENTACION-PRUEBAS-INTEGRACION.md
│   ├── TRAZABILIDAD-Y-REPORTES-INTEGRACION.md
│   ├── movements.integration.test.ts
│   ├── helpers/                      testDatabase, testServer, sessionMock
│   └── setup/                        globalSetup, loadEnv, etc.
│
└── api/                              integración de controladores REST (mocks)
    └── users.integration.test.ts
```

### Convenciones que seguimos

- Los archivos de prueba terminan en `.test.ts`.
- En los bloques `describe` indicamos el CP, la RN o la historia N2026 que cubrimos.
- Las descripciones de los casos están en español.
- En pruebas unitarias no conectamos a la base de datos real: los repositorios siempre van mockeados.

---

## Tipos de prueba

| Tipo | Dónde | Qué prueba | ¿Usa BD real? |
|------|-------|------------|---------------|
| Unitaria | `services/`, `api/`, `lib/` | Handlers, servicios, controladores mockeados | No |
| Integración API | `integration/` | Supertest + Next handlers + PostgreSQL | Sí (`stockly_test`) |
| BDD | `__bdd__/` | Escenarios Gherkin, handlers sin BD | No |
| Manual | Plan PT-DCP-01 (PDF) | UI, flujos completos en QA/Staging | Sí |

---

## Qué tenemos cubierto hoy

Al último corrido teníamos 12 suites y 73 casos: todos pasaron, sin omitidos ni fallos.

| Archivo | Casos | Qué valida |
|---------|-------|------------|
| `VentaHandler.test.ts` | 7 | CP-10, CP-11, RN-06 |
| `DevolucionHandler.test.ts` | 7 | CP-15, CP-16, RN-04 |
| `AjusteSalidaHandler.test.ts` | 4 | CP-18, RN-06 |
| `OtherHandlers.test.ts` | 12 | CP-07, CP-12, CP-14, CP-17 |
| `MovementFactory.test.ts` | 4 | Resolución de handlers por tipo de movimiento |
| `InventoryService.test.ts` | 8 | createProduct, listInventory, FEFO (N2026-4), alertas (N2026-30 / CP-27) |
| `UserService.test.ts` | 5 | CP-19 y validación Zod |
| `MovementService.test.ts` | 2 | Zod antes de tocar repositorio o BD |
| `auth.test.ts` | 3 | Autenticación NextAuth (RNF-03) |
| `inventory.integration.test.ts` | 3 | RF-01, RF-02 (N2026-3, N2026-5) |
| `users.integration.test.ts` | 3 | CP-19, CP-20, RF-15, RF-16, RNF-03 (401, 403, 201) |
| `alertNotifier.test.ts` | 11 | broadcastSummary (3), notifyStockChange (4), notifyEntryIssue (4) — guards, emits y resiliencia |

### Cobertura destacada en módulos críticos

| Módulo | Cobertura (lines) | Notas |
|--------|-------------------|-------|
| `InventoryService.ts` | 100% | Todos los métodos públicos probados |
| `handlers/*.ts` | 100% | Los nueve handlers con tests de validate y execute |
| `MovementFactory.ts` | 100% | Resolución de estrategias |
| `permissions.ts` | 100% | Cubierto al reactivar tests de UserController |

La cobertura global del proyecto ronda el 53% porque repositorios, ProductService y MovementService completo siguen mockeados o sin tests dedicados. Eso es esperado: las pruebas actuales apuntan a la lógica de negocio, no a todo el monolito.

Muchos casos del plan (CP-02, CP-06, CP-13, flujos E2E, etc.) siguen cubiertos de forma manual o pendientes de automatizar. El detalle completo está en `TRAZABILIDAD-Y-REPORTES-QA.md`.

---

## Cómo aislamos las pruebas de la base de datos

1. **Repositorios TypeORM:** se mockean con `jest.mock('../../src/repository/...')`. No se abre conexión real.
2. **ProductService:** en tests de `InventoryService`, se mockea `productService` para `createProduct` y `listInventory` (el servicio delega ahí, no al repositorio directamente).
3. **bcryptjs:** se simulan `hash` y `compare` para no depender del costo real de encriptación.
4. **Transacciones:** en `MovementService.test.ts` se mockea `getDataSource`; los handlers usan un `QueryRunner` falso definido en `movementTestHelpers.ts`.
5. **NextAuth:** en tests de controladores se mockea `getServerSession`.
6. **Servicios:** se instancian handlers directamente; los singletons de servicio tienen sus dependencias mockeadas a nivel de módulo.

---

## Cómo correr las pruebas

Todas las pruebas:

```bash
npm test
```

Solo las unitarias de servicios:

```bash
npm test -- __tests__/services
```

Un archivo concreto:

```bash
npm test -- __tests__/services/movement/VentaHandler.test.ts
```

Con reporte de cobertura (solo suite técnica):

```bash
npm run test:coverage
```

Integración con PostgreSQL (requiere `.env` y Postgres activo):

```bash
npm run test:integration
```

BDD:

```bash
npm run test:bdd
```

El reporte HTML queda en `coverage/lcov-report/index.html`.

Durante el desarrollo, se puede usar watch:

```bash
npx jest --watch __tests__/services
```

---

## Cómo agregar una prueba nueva

1. Colocar el archivo en `services/`, `lib/` o `api/` según corresponda.
2. Nombrar el bloque `describe` con el CP o RF que cubre.
3. Mockear dependencias externas antes de importar el módulo bajo prueba.
4. Limpiar mocks en cada caso con `beforeEach(() => jest.clearAllMocks())`.
5. Actualizar la matriz en `TRAZABILIDAD-Y-REPORTES-QA.md`.

Ejemplo mínimo para un handler:

```typescript
import { VentaHandler } from '../../../src/service/movement/handlers/VentaHandler';
import { buildMovementDto, buildProduct } from '../../helpers/movementTestHelpers';

describe('MiHandler - CP-XX', () => {
  const handler = new VentaHandler();

  it('debe rechazar cuando falta algún dato obligatorio', async () => {
    await expect(handler.validate(buildMovementDto(), buildProduct()))
      .rejects.toThrow('mensaje esperado');
  });
});
```

---

## Informe de Defectos del Ciclo de Desarrollo

Registro consolidado de todos los defectos identificados desde el inicio del proyecto hasta la entrega del 3.er corte (19 de junio de 2026). Los defectos se clasifican por severidad y prioridad según el estándar ISO/IEC 25010 aplicado al plan PT-DCP-01.

### Escala de severidad y prioridad

| Severidad | Definición |
|-----------|-----------|
| **Crítica** | El defecto impide el funcionamiento del sistema o representa un riesgo de seguridad inmediato |
| **Alta** | El defecto afecta un flujo de negocio principal y no tiene workaround viable |
| **Media** | Funcionalidad degradada; existe workaround temporal |
| **Baja** | Inconsistencia menor, cosmética o en documentación técnica |

| Prioridad | Definición |
|-----------|-----------|
| P0 | Bloqueante — debe resolverse antes de cualquier release |
| P1 | Alta — debe resolverse en el sprint actual |
| P2 | Media — puede resolverse en el siguiente sprint |
| P3 | Baja — puede dejarse para backlog de mantenimiento |

---

### Tabla de defectos

| ID | Descripción | Componente afectado | Severidad | Prioridad | CP / RF / RN | Estado | Resolución / Evidencia |
|----|-------------|---------------------|-----------|-----------|--------------|--------|------------------------|
| DEF-001 | Escalada de privilegios en POST /api/v1/users: cualquier cliente podía crear usuarios ADMIN sin sesión activa ni validación de rol | `UserController.createUser` | **Crítica** | P0 | CP-19, CP-20, RF-16, RNF-03 | Resuelto | Se agregó `requireRoles([UserRole.ADMIN])` en todos los métodos de `UserController`. Verificado con tres casos de integración: 401, 403 y 201. |
| DEF-002 | Tests de autorización desactualizados tras refactor de `permissions.ts`: los tests de 401 y 403 fallaban por cambio de estructura de error | `users.integration.test.ts` | **Baja** | P2 | CP-20, RNF-03 | Resuelto | Tests actualizados para validar la nueva forma del objeto de error (`error`, `details`). Suite de integración pasa al 100%. |
| DEF-003 | FEFO implementado en `InventoryService.getLotWithFefo()` pero no conectado a `VentaHandler`: el despacho descuenta stock global del producto sin elegir el lote correcto | `VentaHandler`, `InventoryService` | **Media** | P1 | N2026-4, RF-09 | Abierto | El test unitario de FEFO pasa. Falta integrarlo en el flujo de salida. Riesgo: se despachan unidades sin respetar fecha de vencimiento bajo carga real. |
| DEF-004 | Inconsistencia documental: el plan PT-DCP-01 documenta el campo `isActive` en la entidad `Movement`; la entidad real usa `isAnnulled` | Entidad `Movement`, documentación | **Baja** | P3 | CP-05, CP-23, RNF-06 | Abierto | Se recomienda alinear el plan o agregar un alias en la entidad. No impacta el comportamiento en producción. |
| DEF-005 | `inventory.integration.test.ts` usa campos que pueden no existir en el DTO real; pasa porque `ProductService` está mockeado, ocultando la discrepancia | `inventory.integration.test.ts` | **Baja** | P3 | CP-01, RF-01 | Abierto | Requiere revisar los campos del DTO contra el esquema Zod y la entidad `Product`. Bajo riesgo inmediato. |
| DEF-006 | Sin prueba de idempotencia en doble anulación (CP-06): el segundo PATCH sobre un movimiento ya anulado no está cubierto ni en unitarias ni en integración | `MovementController.annulMovement` | **Media** | P2 | CP-06, RNF-06 | Abierto | Brecha de cobertura. Podría devolver 200 en lugar de 409 en el segundo intento. Se requiere test de integración. |
| DEF-007 | El módulo `src/lib/realtime` tiene cobertura del 63%: los paths de reconexión y manejo de errores de Socket.IO no están cubiertos | `alertNotifier.ts`, `realtime/` | **Media** | P2 | N2026-30, RF-22 | Abierto | Las rutas críticas del notificador (broadcastSummary, notifyStockChange) están cubiertas. Las rutas de reconexión son de baja frecuencia en producción. |

---

### Observaciones técnicas al equipo

**DEF-001 (Resuelto — Crítica):** Este defecto constituía el riesgo de seguridad más alto del ciclo. La ausencia de un guardia de autorización en el endpoint de creación de usuarios habría permitido a cualquier agente externo obtener privilegios administrativos. La solución adoptada (`requireRoles`) es coherente con el patrón de control de acceso basado en roles (RBAC) ya presente en el resto de los controladores. Se recomienda establecer una prueba de regresión permanente para cualquier endpoint que opere sobre entidades de usuario.

**DEF-003 (Abierto — Media):** La implementación de FEFO es funcionalmente correcta a nivel de servicio, lo que demuestra que la lógica de negocio está bien modelada. La brecha está en el acoplamiento entre `InventoryService.getLotWithFefo()` y el flujo de ejecución de `VentaHandler`. Para el siguiente sprint se recomienda inyectar la dependencia del servicio de inventario dentro del handler o crear un paso explícito de selección de lote antes del descuento de stock (RN-06 garantiza que no haya negativo, pero FEFO garantiza que el lote correcto salga primero).

**DEF-006 y DEF-007 (Abiertos — Media):** Representan brechas de calidad que no bloquean la operación del MVP pero deben cerrarse antes de la siguiente iteración productiva. Se sugiere priorizarlos en el backlog de pruebas del 4.o corte.

---

## Documentos relacionados

| Documento | Ubicación |
|-----------|-----------|
| Plan de pruebas oficial | `__tests__/PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf` |
| Matriz de trazabilidad, fallos y defectos (técnica) | `__tests__/TRAZABILIDAD-Y-REPORTES-QA.md` |
| Documentación suite BDD | `__bdd__/DOCUMENTACION-PRUEBAS-BDD.md` |
| Matriz BDD (escenarios vs CP) | `__bdd__/TRAZABILIDAD-Y-REPORTES-BDD.md` |
| Documentación integración API | `__tests__/integration/DOCUMENTACION-PRUEBAS-INTEGRACION.md` |
| Matriz integración (API vs CP) | `__tests__/integration/TRAZABILIDAD-Y-REPORTES-INTEGRACION.md` |
| Configuración Jest (técnica) | `jest.config.js` |
| Configuración Jest (BDD) | `jest.bdd.config.js` |
| Configuración Jest (integración) | `jest.integration.config.js` |
| Código bajo prueba | `src/service/`, `src/controller/`, `src/lib/` |

---

## Equipo Nuclear 2026

Derly Elena Quejada Perea, Juan José Quintero, Maria Luisa Londoño Moncada, Nicolás Santiago Carmona, Xiomara Ocampo Hurtado y Juan Manuel Pinzon.
