# Trazabilidad y reportes QA — Suite de integración Stockly

**Plan:** PT-DCP-01 v1.0  
**Fecha del reporte:** 7 de junio de 2026  
**Comando:** `npm run test:integration`  
**Estado:** 7 pruebas pasaron, ninguna omitida ni fallida

---

## 1. Matriz de trazabilidad (API + PostgreSQL vs. requisitos)

Relaciona cada prueba de `movements.integration.test.ts` con casos de prueba (CP), requisitos funcionales (RF), reglas de negocio (RN) y requisitos no funcionales (RNF).

### Leyenda

| Estado | Significado |
|--------|-------------|
| Automatizado integración | Prueba en `npm run test:integration` con BD real |
| Cubierto también en unitarias/BDD | Misma regla en otra suite |
| Manual | Solo plan PT-DCP-01 en QA/Staging |
| Pendiente | Sin prueba de integración aún |

---

### 1.1 Pruebas por escenario

| Escenario | Prueba | CP | RF / RN / RNF | Endpoint | Verificación en BD |
|-----------|--------|-----|---------------|----------|-------------------|
| 1 — Logística de salida | Descuenta stock tras venta exitosa | CP-10 | RF-07, RF-08 | POST `/api/v1/movements` | Stock decrementado |
| 1 — Logística de salida | Rechaza sin stock suficiente | CP-11 | RF-09, **RN-06** | POST `/api/v1/movements` | Stock y count movements sin cambio |
| 1 — Logística de salida | Crea registro Movement | CP-21 | RF-17 | POST `/api/v1/movements` | Fila en tabla `movements` |
| 2 — Trazabilidad | Anulación soft delete + stock | CP-05, CP-23 | **RNF-06** | PATCH `.../annul` | `isAnnulled`, `annulledReason`, stock 50 |
| 3 — Seguridad | POST sin sesión | CP-20 | RF-16, **RNF-03** | POST `/api/v1/movements` | 401; BD intacta |
| 3 — Seguridad | Despachador → ENTRADA | CP-20 | RF-16, **RNF-03** | POST `/api/v1/movements` | 403; BD intacta |
| 3 — Seguridad | Despachador → annul | CP-20 | RF-16 | PATCH `.../annul` | 403; `isAnnulled` sigue false |

---

### 1.2 Infraestructura bajo prueba

| Componente | Archivo | Rol |
|------------|---------|-----|
| Route POST movimientos | `src/app/api/v1/movements/route.ts` | Entrada HTTP de ventas |
| Route PATCH anulación | `src/app/api/v1/movements/[id]/annul/route.ts` | Soft delete |
| MovementService | `src/service/MovementService.ts` | Transacciones y reglas |
| VentaHandler | vía factory | Validación venta + stock |
| permissions.ts | `requireSession`, `requireRoles` | 401 / 403 |
| PostgreSQL | `stockly_test` | Persistencia real |

| Mock | Archivo | Qué simula |
|------|---------|------------|
| getServerSession | `sessionMock.ts` | Admin, Despachador, sin sesión |
| Servidor HTTP | `testServer.ts` | Adaptador Supertest → Next handlers |

---

### 1.3 Cobertura integración vs. otras suites

| CP | Descripción | Integración | Unitarias | BDD |
|----|-------------|-------------|-----------|-----|
| CP-05 | Anulación exitosa | Automatizado | Manual | Automatizado |
| CP-10 | Venta con cliente | Automatizado | Automatizado | Automatizado |
| CP-11 | Stock insuficiente | Automatizado (+ BD) | Automatizado | Automatizado |
| CP-20 | Control de roles | Automatizado (401/403) | Parcial (users API) | No |
| CP-21 | Registro en auditoría | Automatizado (+ BD) | Pendiente | No |
| CP-23 | Soft delete | Automatizado (+ BD) | Parcial (auth) | Automatizado |
| CP-06 | Doble anulación | Pendiente | Pendiente | Pendiente |
| CP-29 | Flujo E2E completo | Pendiente | Pendiente | Pendiente |

La integración aporta lo que unitarias y BDD no cubren: **HTTP + PostgreSQL en la misma corrida**.

---

### 1.4 Fixtures de prueba (`testDatabase.ts`)

| Entidad | ID / dato | Uso |
|---------|-----------|-----|
| Producto | `TEST_PRODUCT_ID`, stock 50 | Ventas y anulaciones |
| Cliente | `TEST_CLIENT_ID` | Ventas tipo DETAL |
| Usuario Despachador | `despachadorUserId` | Ventas permitidas |
| Usuario Admin | `TEST_USER_ID` | Anulación permitida |
| Categoría / Subcategoría | UUIDs fijos | FK de producto |

---

## 2. Informe de casos fallidos y omitidos

**Última ejecución:** 7 de junio de 2026

### 2.1 Casos fallidos

No hay pruebas fallando. Las 7 pasan con PostgreSQL disponible.

### 2.2 Casos omitidos

No hay pruebas con `skip` en la suite de integración.

### 2.3 Fallos por entorno (no son bugs de código)

| Situación | Síntoma | Solución |
|-----------|---------|----------|
| PostgreSQL apagado | Error de conexión en globalSetup | `docker-compose up postgres` |
| Credenciales incorrectas | ECONNREFUSED o auth failed | Revisar `.env` |
| BD bloqueada | Timeout en TRUNCATE | Cerrar conexiones externas a `stockly_test` |

---

## 3. Informe de defectos relacionados

| ID | Descripción | Severidad | Estado | Relación integración |
|----|-------------|-----------|--------|----------------------|
| DEF-001 | Escalada de roles UserController | Crítica | Resuelto | Cubierto en users.integration; movimientos usa mismo patrón 401/403 |
| DEF-002 | Tests auth desactualizados | Baja | Resuelto | Coherente: sin sesión → 401 en movimientos |
| DEF-003 | FEFO no en VentaHandler | Media | Abierto | Integración prueba stock global, no lotes |
| DEF-INT-001 | Solo rutas movements en testServer | Baja | Abierto | Ampliar adaptador para products, users, etc. |
| DEF-INT-002 | Sin prueba doble anulación (CP-06) | Media | Abierto | Pendiente segundo PATCH annul |

---

## 4. Historial de ejecuciones

| Fecha | Comando | Resultado | Notas |
|-------|---------|-----------|-------|
| 2026-06-07 | npm run test:integration | 7 pasaron | Implementación inicial |
| 2026-06-07 | npm test | 59 pasaron | Sin cambios; integration excluida |
| 2026-06-07 | npm run test:bdd | 5 pasaron | Sin cambios |

---

## 5. Referencias

- Guía integración: `DOCUMENTACION-PRUEBAS-INTEGRACION.md`
- Suite técnica: `__tests__/DOCUMENTACION-PRUEBAS.md`
- Suite BDD: `__bdd__/DOCUMENTACION-PRUEBAS-BDD.md`
- Defectos generales: `__tests__/TRAZABILIDAD-Y-REPORTES-QA.md`
- Test principal: `movements.integration.test.ts`
