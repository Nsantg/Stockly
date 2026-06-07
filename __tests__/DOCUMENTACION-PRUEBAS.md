# Documentación de pruebas — Stockly

**Proyecto:** Nuclear 2026 (N2026), gestor de inventario Stockly  
**Asignatura:** Pruebas de Software | Arquitectura de Software | Programación con tecnologías web  
**Plan de referencia:** `PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf`  
**Última ejecución registrada:** 7 de junio de 2026 — suite técnica: 59 pruebas pasaron; suite BDD: 5 escenarios pasaron

---

## Dos suites de prueba en el proyecto

Stockly tiene **dos carpetas independientes** de pruebas automatizadas:

| Suite | Carpeta | Comando | Enfoque |
|-------|---------|---------|---------|
| **Técnica** | `__tests__/` | `npm test` | Unitarias e integración con Jest (`describe` / `it`) |
| **BDD** | `__bdd__/` | `npm run test:bdd` | Escenarios Gherkin en español con jest-cucumber |

La configuración BDD usa `jest.bdd.config.js` y **no modifica** `jest.config.js`. Documentación BDD: `__bdd__/DOCUMENTACION-PRUEBAS-BDD.md`.

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
├── lib/                              integración ligera de lib y controladores
│   ├── auth.test.ts
│   └── inventory.integration.test.ts
│
└── api/                              integración de controladores REST
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
| Unitaria | `services/` | Handlers, servicios, factory, validación Zod | No |
| Integración de controlador | `lib/`, `api/` | Respuestas HTTP con servicios mockeados | No |
| Manual | Plan PT-DCP-01 (PDF) | UI, flujos completos, revisión en pgAdmin | Sí, en QA/Staging |

---

## Qué tenemos cubierto hoy

Al último corrido teníamos 11 suites y 59 casos: todos pasaron, sin omitidos ni fallos.

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

Con reporte de cobertura:

```bash
npm run test:coverage
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

## Documentos relacionados

| Documento | Ubicación |
|-----------|-----------|
| Plan de pruebas oficial | `__tests__/PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf` |
| Matriz de trazabilidad, fallos y defectos (técnica) | `__tests__/TRAZABILIDAD-Y-REPORTES-QA.md` |
| Documentación suite BDD | `__bdd__/DOCUMENTACION-PRUEBAS-BDD.md` |
| Matriz BDD (escenarios vs CP) | `__bdd__/TRAZABILIDAD-Y-REPORTES-BDD.md` |
| Configuración Jest (técnica) | `jest.config.js` |
| Configuración Jest (BDD) | `jest.bdd.config.js` |
| Código bajo prueba | `src/service/`, `src/controller/`, `src/lib/` |

---

## Equipo Nuclear 2026

Derly Elena Quejada Perea, Juan José Quintero, Maria Luisa Londoño Moncada, Nicolás Santiago Carmona, Xiomara Ocampo Hurtado y Juan Manuel Pinzon.
