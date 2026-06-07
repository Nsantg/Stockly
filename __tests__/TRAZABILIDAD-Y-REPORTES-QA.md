# Trazabilidad y reportes QA — Stockly

**Plan:** PT-DCP-01 v1.0  
**Fecha del reporte:** 7 de junio de 2026  
**Estado de la suite técnica:** 59 pruebas pasaron (`npm test`)  
**Estado de la suite BDD:** 5 escenarios pasaron (`npm run test:bdd`)  
**Estado de la suite integración:** 7 pruebas pasaron (`npm run test:integration`)

---

## 1. Matriz de trazabilidad (código vs. requisitos)

Esta tabla relaciona cada archivo de prueba automatizada con los requisitos funcionales (RF), no funcionales (RNF), reglas de negocio (RN), historias Jira (N2026-X) y casos de prueba (CP) del plan PT-DCP-01.

### Leyenda

| Estado | Significado |
|--------|-------------|
| Automatizado | Cubierto por una prueba que corre en Jest |
| Manual | Cubierto en el plan PT-DCP-01, ejecutado a mano en QA/Staging |
| Pendiente | Aún no hay prueba automatizada |
| Parcial | Solo algunos escenarios del CP están automatizados |

---

### 1.1 Pruebas unitarias (`__tests__/services/`)

| Archivo | Caso que prueba | CP | RF / RNF / RN | Para qué sirve |
|---------|-----------------|-----|---------------|----------------|
| `movement/VentaHandler.test.ts` | Venta válida con cliente | CP-10 | RF-07, RF-08, RF-20 | Confirma que la venta exige cliente y descuenta stock |
| `movement/VentaHandler.test.ts` | Rechazo sin clientId o clientType | CP-10 | RF-08, RF-20 | Impide guardar un despacho sin datos del cliente |
| `movement/VentaHandler.test.ts` | Stock insuficiente | CP-11 | RF-09, RN-06 | Bloquea salidas que dejarían el inventario en negativo |
| `movement/VentaHandler.test.ts` | Cantidad igual al stock disponible | CP-11 | RN-06 | Verifica el límite permitido cuando stock y cantidad coinciden |
| `movement/DevolucionHandler.test.ts` | Devolución de producto eléctrico | CP-15 | RF-12, RN-04 | Permite devolver solo productos con serial habilitado |
| `movement/DevolucionHandler.test.ts` | Rechazo de producto no eléctrico | CP-16 | RF-12, RN-04 | Impide devoluciones en categorías como Masoterapia |
| `movement/AjusteSalidaHandler.test.ts` | Ajuste de salida válido e inválido | CP-18 | RF-13, RN-06 | Los ajustes de salida respetan el stock disponible |
| `movement/OtherHandlers.test.ts` | Entrada incrementa stock | CP-07 | RF-05 | Registro de entrada actualiza inventario |
| `movement/OtherHandlers.test.ts` | Salida por daño y vencimiento | CP-12 | RF-07 | Tipos sin cliente, con validación de stock |
| `movement/OtherHandlers.test.ts` | Traslado bodega a vitrina | CP-14 | RF-11 | Stock total no disminuye |
| `movement/OtherHandlers.test.ts` | Ajuste de ingreso | CP-17 | RF-13, RF-14 | Incremento con motivo obligatorio |
| `movement/MovementFactory.test.ts` | Resolución por MovementType | — | Arquitectura | Cada tipo de movimiento delega al handler correcto |
| `InventoryService.test.ts` | createProduct | CP-01 | RF-01 | Delegación correcta a productService |
| `InventoryService.test.ts` | listInventory | CP-04 | RF-02 | Listado vía getAllProducts |
| `InventoryService.test.ts` | Alerta crítica bajo mínimo | CP-27, N2026-30 | RF-22 | Genera alerta cuando stock es menor o igual al mínimo |
| `InventoryService.test.ts` | FEFO: lote que vence primero | N2026-4 | Rotación FEFO | Elige el lote con expirationDate más cercana |
| `UserService.test.ts` | Registro con bcrypt | CP-19 | RF-15, RF-16, RNF-03 | La contraseña no se guarda en texto plano |
| `UserService.test.ts` | Zod rechaza DTO inválido | CP-19 | RF-15 | La validación ocurre antes del repositorio |
| `MovementService.test.ts` | Zod rechaza UUID o cantidad inválidos | — | RF-07 | El servicio no toca la BD si el DTO es incorrecto |

---

### 1.2 Pruebas de integración (`__tests__/lib/` y `__tests__/api/`)

| Archivo | Caso que prueba | CP | RF / RNF | Para qué sirve |
|---------|-----------------|-----|----------|----------------|
| `lib/auth.test.ts` | Login con credenciales correctas | CP-31 | RNF-03 | NextAuth devuelve el usuario cuando todo es válido |
| `lib/auth.test.ts` | Contraseña incorrecta | CP-31 | RNF-03 | Devuelve null sin filtrar información extra |
| `lib/auth.test.ts` | Usuario inactivo | CP-05, CP-23 | RNF-06 | Usuarios desactivados no pueden iniciar sesión |
| `lib/inventory.integration.test.ts` | POST producto con datos incompletos | CP-01 | RF-01, N2026-3 | La API responde 400 cuando Zod falla |
| `lib/inventory.integration.test.ts` | POST producto exitoso | CP-01 | RF-01, N2026-3 | Creación correcta responde 201 |
| `lib/inventory.integration.test.ts` | GET inventario | CP-04 | RF-02, N2026-5 | Listado responde 200 con los productos |
| `api/users.integration.test.ts` | Admin crea otro Admin | CP-19 | RF-15, RF-16 | Flujo permitido cuando el solicitante es ADMIN |
| `api/users.integration.test.ts` | Sin sesión activa | CP-20 | RF-16, RNF-03 | Responde 401; createUser no se invoca |
| `api/users.integration.test.ts` | Despachador intenta crear Admin | CP-20 | RF-16, RNF-03 | Responde 403 con Acceso prohibido |

---

### 1.3 Casos del plan — estado de automatización

| CP | Descripción | RF | Unitarias | BDD | Integración API |
|----|-------------|-----|-----------|-----|-----------------|
| CP-01 | Registro producto válido | RF-01 | Parcial | No | No |
| CP-02 | Código duplicado | RF-01 | Pendiente | No | No |
| CP-05 | Anulación exitosa | RNF-06 | Manual | Sí | Sí |
| CP-06 | Doble anulación | RNF-06 | Pendiente | No | No |
| CP-07 | Entrada incrementa stock | RF-05 | Sí | No | No |
| CP-10 | Venta con cliente | RF-07 | Sí | Sí | Sí |
| CP-11 | Stock insuficiente | RF-09 | Sí | Sí | Sí |
| CP-20 | Control de roles | RF-16 | Parcial | No | Parcial |
| CP-21 | Registro en auditoría | RF-17 | Pendiente | No | Sí |
| CP-23 | Soft delete | RNF-06 | Parcial | Sí | Sí |
| CP-29 | Flujo E2E | RF-05,07,17 | Pendiente | No | No |

Casos restantes del plan: ver matriz completa en secciones 1.1–1.2 o en el PDF PT-DCP-01. Muchos CPs menores siguen solo en manual o unitarias.

---
### 1.4 Cobertura BDD (`npm run test:bdd`)

Escenarios Gherkin en `__bdd__/features/`. Detalle en `__bdd__/TRAZABILIDAD-Y-REPORTES-BDD.md`.

| CP | Feature | Escenario |
|----|---------|-----------|
| CP-10 | venta.feature | Despacho exitoso que descuenta stock |
| CP-11 | venta.feature | Despacho rechazado por stock insuficiente |
| CP-15 | devoluciones.feature | Devolución aceptada para Electroterapia |
| CP-16 | devoluciones.feature | Devolución rechazada para producto no eléctrico |
| CP-05, CP-08, CP-23 | trazabilidad.feature | Anulación de movimiento con soft delete |

### 1.5 Cobertura integración API (`npm run test:integration`)

Pruebas con Supertest y PostgreSQL real en `stockly_test`. Detalle en `__tests__/integration/TRAZABILIDAD-Y-REPORTES-INTEGRACION.md`.

| CP | Escenario integración | Endpoint |
|----|----------------------|----------|
| CP-10 | Venta descuenta stock | POST `/api/v1/movements` |
| CP-11 | Stock insuficiente, BD intacta | POST `/api/v1/movements` |
| CP-21 | Movement persistido | POST `/api/v1/movements` |
| CP-05, CP-23 | Anulación soft delete + stock | PATCH `.../annul` |
| CP-20 | 401 sin sesión; 403 rol incorrecto | POST / PATCH movimientos |

---

## 2. Informe de casos fallidos y omitidos

**Última ejecución:** 7 de junio de 2026  
**Comando:** `npm test`

### 2.1 Casos fallidos

No hay pruebas fallando. Los 59 casos activos pasan correctamente.

### 2.2 Casos omitidos

No hay pruebas omitidas. Los dos tests de autorización en `users.integration.test.ts` fueron reactivados y alineados con el contrato actual de `permissions.ts`:

- Sin sesión: status 401, error `No autorizado`, campo `details` presente.
- Rol Despachador: status 403, error `Acceso prohibido`, `details` menciona el rol ADMIN requerido.

### 2.3 Brechas que no son fallos, pero sí riesgo

| Brecha | Por qué importa | CP / RN afectados |
|--------|-----------------|-------------------|
| FEFO no conectado a VentaHandler | El servicio elige el lote correcto, pero la venta descuenta stock global del producto | N2026-4 |
| Sin prueba de doble anulación (CP-06) | Segundo PATCH annul no verificado | CP-06 |
| CP-20 incompleto para Visualizador | Solo probamos 401/403 en creación de usuarios, no el rol Visualizador en otros módulos | CP-20 |
| Sin flujos E2E multi-módulo | CP-29 y CP-30 requieren encadenar varios endpoints | CP-29, CP-30 |
| CP-06 idempotencia | Segundo PATCH annul no probado en integración | CP-06 |

---

## 3. Informe de defectos del ciclo de desarrollo

| ID | Descripción | Severidad | Prioridad | CP / RF | Estado | Evidencia |
|----|-------------|-----------|-----------|---------|--------|-----------|
| DEF-001 | Escalada de privilegios en POST /api/v1/users: cualquier cliente podía crear usuarios ADMIN sin sesión ni validación de rol | Crítica | P0 | CP-19, CP-20, RF-16, RNF-03 | Resuelto | requireRoles(ADMIN_ONLY) en UserController |
| DEF-002 | Tests de autorización desactualizados tras refactor de permissions.ts | Baja | P2 | CP-20, RNF-03 | Resuelto | users.integration.test.ts: 401, 403 y 201 pasando |
| DEF-003 | FEFO solo consulta el lote correcto; VentaHandler no lo usa al despachar | Media | P1 | N2026-4 | Abierto | Test unitario FEFO pasa; falta integrarlo en salidas |
| DEF-004 | El plan documenta isActive en movimientos; la entidad Movement usa isAnnulled | Baja | P3 | CP-05, CP-23, RNF-06 | Abierto | Revisar entidad Movement frente al plan CP-23 |
| DEF-005 | inventory.integration.test.ts usa campos que pueden no existir en el DTO real; pasa porque el servicio está mockeado | Baja | P3 | CP-01, RF-01 | Abierto | inventory.integration.test.ts |

---

### Detalle de DEF-001 (escalada de roles)

| Campo | Detalle |
|-------|---------|
| Componente | UserController.createUser, ruta POST /api/v1/users |
| Cómo se reproducía | Enviar POST sin cookie de sesión, o con rol Despachador, pidiendo crear un usuario ADMIN |
| Impacto | Cualquier persona con acceso al endpoint podía obtener privilegios administrativos |
| Corrección | requireRoles([UserRole.ADMIN]) en todos los métodos de UserController |
| Verificación | Tres tests en users.integration.test.ts: 401 sin sesión, 403 sin rol Admin, 201 con Admin |

---

### Plantilla para registrar nuevos defectos

```
ID:           DEF-XXX
Descripción:  Qué falla y en qué componente
Severidad:    Crítica | Alta | Media | Baja
Prioridad:    P0 | P1 | P2 | P3
CP/RF:        CP-XX / RF-XX
Estado:       Abierto | En progreso | Resuelto | Cerrado
Evidencia:    Archivo de test, log, captura o commit
```

---

## 4. Historial de ejecuciones

| Fecha | Comando | Resultado | Notas |
|-------|---------|-----------|-------|
| 2026-06-07 | npm run test:integration | 7 pasaron | Supertest + PostgreSQL stockly_test |
| 2026-06-07 | npm run test:bdd | 5 pasaron | Suite BDD; documentación en __bdd__/ |
| 2026-06-07 | npm test -- __tests__/services | 57 pasaron | Solo pruebas unitarias de servicios |
| 2026-06-07 | npm test (corrido anterior) | 40 pasaron, 2 omitidas | Documentación inicial |

---

## 5. Referencias

- Estructura y comandos (técnica): `DOCUMENTACION-PRUEBAS.md`
- Estructura y comandos (BDD): `__bdd__/DOCUMENTACION-PRUEBAS-BDD.md`
- Estructura y comandos (integración): `__tests__/integration/DOCUMENTACION-PRUEBAS-INTEGRACION.md`
- Matriz integración: `__tests__/integration/TRAZABILIDAD-Y-REPORTES-INTEGRACION.md`
- Matriz BDD: `__bdd__/TRAZABILIDAD-Y-REPORTES-BDD.md`
- Plan de casos manuales: `PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf`
- Permisos y roles: `src/lib/permissions.ts`
- Handlers de movimientos: `src/service/movement/handlers/`
