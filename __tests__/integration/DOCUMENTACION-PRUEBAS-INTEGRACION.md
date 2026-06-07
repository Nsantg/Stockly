# Documentación de pruebas de integración — Stockly

**Proyecto:** Nuclear 2026 (N2026), gestor de inventario Stockly  
**Asignatura:** Pruebas de Software | Arquitectura de Software | Programación con tecnologías web  
**Plan de referencia:** `__tests__/PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf`  
**Última ejecución registrada:** 7 de junio de 2026 — 7 pruebas pasaron, ninguna omitida ni fallida

---

## Para qué sirve esta suite

La suite de integración valida el sistema **de punta a punta** en la capa API: peticiones HTTP reales (Supertest), handlers de Next.js, lógica de negocio y **PostgreSQL real** en la base de datos `stockly_test`.

A diferencia de las pruebas unitarias (`npm test`), aquí no se mockean repositorios ni transacciones. A diferencia de BDD (`npm run test:bdd`), aquí sí hay base de datos y rutas HTTP completas.

Solo se mockea la **sesión de NextAuth** (`getServerSession`), porque los tests no levantan el flujo de login completo. El resto — validaciones, handlers, TypeORM, stock — es real.

---

## Requisitos previos


| Requisito               | Detalle                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| PostgreSQL en ejecución | Por ejemplo: `docker-compose up postgres`                              |
| Credenciales en `.env`  | `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD` |
| Base de datos de prueba | `stockly_test` (se crea sola si no existe)                             |
| Migraciones             | Se aplican en `globalSetup` antes de correr los tests                  |


---

## Ejecución

```bash
npm run test:integration
```

La suite técnica **no** incluye estos tests (están excluidos en `jest.config.js` con `testPathIgnorePatterns`), así que `npm test` no exige PostgreSQL.


| Comando                    | BD real | HTTP                  | Descripción                                 |
| -------------------------- | ------- | --------------------- | ------------------------------------------- |
| `npm test`                 | No      | Parcial (NextRequest) | 59 unitarias + integración ligera con mocks |
| `npm run test:bdd`         | No      | No                    | 5 escenarios Gherkin                        |
| `npm run test:integration` | Sí      | Sí (Supertest)        | 7 pruebas API + PostgreSQL                  |


---

## Herramientas que usamos


| Herramienta                     | Para qué la usamos                                        |
| ------------------------------- | --------------------------------------------------------- |
| **Jest**                        | Runner con config dedicada (`jest.integration.config.js`) |
| **Supertest**                   | Cliente HTTP contra un servidor Node de prueba            |
| **PostgreSQL**                  | Persistencia real en `stockly_test`                       |
| **TypeORM**                     | Migraciones y acceso a datos en tests                     |
| **Next.js route handlers**      | `POST /api/v1/movements`, `PATCH .../annul`               |
| **jest.mock(getServerSession)** | Simular Admin, Despachador o sin sesión                   |


Configuración en `jest.integration.config.js`:

```javascript
testMatch: ['**/__tests__/integration/**/*.integration.test.ts']
globalSetup: globalSetup.ts      // crea BD + migraciones
globalTeardown: globalTeardown.ts
setupFiles: loadEnv.ts           // carga .env
setupFilesAfterEnv: setupAfterEnv.ts
testTimeout: 60_000
maxWorkers: 1                    // evita condiciones de carrera en BD
```

---

## Cómo está organizada la carpeta

```
__tests__/integration/
├── DOCUMENTACION-PRUEBAS-INTEGRACION.md   (este documento)
├── TRAZABILIDAD-Y-REPORTES-INTEGRACION.md (matriz CP/RF vs pruebas)
├── movements.integration.test.ts          7 pruebas (AAA + comentarios CP/RF)
│
├── helpers/
│   ├── testDatabase.ts                    clearDatabase(), seedTestFixtures()
│   ├── testServer.ts                      Supertest + adaptador HTTP → Next handlers
│   └── sessionMock.ts                     mock de getServerSession / NextAuth
│
└── setup/
    ├── globalSetup.ts                     crea stockly_test + migraciones
    ├── globalTeardown.ts
    ├── loadEnv.ts                         carga variables desde .env
    └── setupAfterEnv.ts
```

En la raíz del proyecto: `jest.integration.config.js` y script `test:integration` en `package.json`.

---

## Escenarios validados

### Escenario 1 — Logística de salida (`POST /api/v1/movements` — VENTA)


| Prueba                             | CP / RF              | Qué valida                                        |
| ---------------------------------- | -------------------- | ------------------------------------------------- |
| Descuenta stock tras venta exitosa | CP-10 / RF-07, RF-08 | 201; stock disminuye en la cantidad vendida       |
| Rechaza sin stock suficiente       | CP-11 / RF-09, RN-06 | 400; mensaje de stock insuficiente; BD intacta    |
| Crea registro Movement             | CP-21 / RF-17        | Fila persistida en PostgreSQL con datos correctos |


### Escenario 2 — Trazabilidad (`PATCH /api/v1/movements/{id}/annul`)


| Prueba                    | CP / RF               | Qué valida                                                    |
| ------------------------- | --------------------- | ------------------------------------------------------------- |
| Anulación con soft delete | CP-05, CP-23 / RNF-06 | `isAnnulled: true`; motivo y fecha; stock revertido (42 → 50) |


### Escenario 3 — Seguridad (autenticación y roles)


| Prueba                      | CP / RF               | Qué valida                                |
| --------------------------- | --------------------- | ----------------------------------------- |
| POST sin sesión             | CP-20 / RF-16, RNF-03 | 401 `No autorizado`; BD sin cambios       |
| Despachador intenta ENTRADA | CP-20 / RF-16, RNF-03 | 403 `Acceso prohibido`; BD sin cambios    |
| Despachador intenta anular  | CP-20 / RF-16         | 403; movimiento sigue `isAnnulled: false` |


---

## Detalles técnicos

### Supertest sin levantar Next.js completo

Jest y el runtime ESM de Next.js no conviven bien para un `next dev` embebido. Por eso `testServer.ts` crea un servidor HTTP Node mínimo que:

1. Recibe la petición con Supertest.
2. Construye un `NextRequest` con el body y headers.
3. Invoca directamente los route handlers exportados (`postMovement`, `patchAnnulMovement`).
4. Escribe la `NextResponse` de vuelta al cliente HTTP.

Así se prueba la misma lógica que producción, sin el overhead del framework completo.

### Limpieza de datos

- `**afterEach`:** `clearDatabase()` ejecuta `TRUNCATE ... RESTART IDENTITY CASCADE` sobre tablas de negocio.
- `**beforeEach`:** `seedTestFixtures()` inserta categoría, subcategoría, producto (stock 50), cliente y usuarios de prueba.
- `**afterAll`:** limpieza final y cierre de conexión TypeORM.

### Autenticación mockeada

`sessionMock.ts` configura `getServerSession` para devolver Admin, Despachador o `null`. La comprobación de roles sigue pasando por `permissions.ts` real.

**Nota importante:** sin sesión la API responde **401** (`No autorizado`), no 403. Eso es coherente con `requireSession()` en `permissions.ts` y con los tests de `users.integration.test.ts`.

### Patrón AAA en los tests

Cada caso sigue Arrange–Act–Assert, con comentarios que referencian CP y RF:

```typescript
// CP-11 | RF-09, RN-06 — Rechazo de despacho por stock insuficiente
const stockBefore = await getProductStock(dataSource);

// Act
const response = await agent.post('/api/v1/movements').send({ ... });

// Assert
expect(response.status).toBe(400);
expect(await getProductStock(dataSource)).toBe(stockBefore);
```

---

## Relación con las otras suites


| Capa probada      | Unitarias | BDD                  | Integración  |
| ----------------- | --------- | -------------------- | ------------ |
| Handlers aislados | Sí        | Sí                   | No (vía API) |
| PostgreSQL        | No        | No                   | Sí           |
| HTTP Supertest    | No        | No                   | Sí           |
| Gherkin legible   | No        | Sí                   | No           |
| NextAuth sesión   | Mock      | N/A                  | Mock         |
| Movimiento en BD  | Mock      | Mock (annul parcial) | Real         |


Las tres suites se complementan: unitarias para regresión rápida, BDD para lenguaje de negocio, integración para confianza en API + BD.

---

## Cómo agregar una prueba de integración

1. Asegurar que PostgreSQL y `stockly_test` estén disponibles.
2. Añadir el caso en `movements.integration.test.ts` (o nuevo `*.integration.test.ts`).
3. Usar `seedTestFixtures` y `mockSession` en `beforeEach`.
4. Verificar estado en BD con helpers de `testDatabase.ts` (no solo el status HTTP).
5. Registrar el CP en `TRAZABILIDAD-Y-REPORTES-INTEGRACION.md`.
6. Si la ruta no existe en `testServer.ts`, agregar el enrutamiento al adaptador HTTP.

---

## Documentos relacionados


| Documento                 | Ubicación                                                            |
| ------------------------- | -------------------------------------------------------------------- |
| Matriz CP/RF integración  | `TRAZABILIDAD-Y-REPORTES-INTEGRACION.md`                             |
| Suite técnica (unitarias) | `__tests__/DOCUMENTACION-PRUEBAS.md`                                 |
| Suite BDD                 | `__bdd__/DOCUMENTACION-PRUEBAS-BDD.md`                               |
| Plan PT-DCP-01            | `__tests__/PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf` |
| Config integración        | `jest.integration.config.js`                                         |
| Permisos                  | `src/lib/permissions.ts`                                             |


---

## Equipo Nuclear 2026

Derly Elena Quejada Perea, Juan José Quintero, Maria Luisa Londoño Moncada, Nicolás Santiago Carmona, Xiomara Ocampo Hurtado y Juan Manuel Pinzon.