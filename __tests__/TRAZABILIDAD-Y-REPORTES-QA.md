# Trazabilidad y reportes QA — Stockly

**Plan:** PT-DCP-01 v1.0  
**Fecha del reporte:** 7 de junio de 2026  
**Estado de la suite:** 40 pruebas pasaron, 2 omitidas, ninguna falló

---

## 1. Matriz de trazabilidad (código vs. requisitos)

Esta tabla relaciona cada archivo de prueba automatizada con los requisitos funcionales (RF), no funcionales (RNF), reglas de negocio (RN), historias Jira (N2026-X) y casos de prueba (CP) del plan PT-DCP-01.

### Leyenda

| Estado | Significado |
|--------|-------------|
| Automatizado | Cubierto por una prueba que corre en Jest |
| Omitido | Existe el test pero está marcado con `skip` |
| Manual | Cubierto en el plan PT-DCP-01, ejecutado a mano en QA/Staging |
| Pendiente | Aún no hay prueba automatizada |

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
| `movement/MovementFactory.test.ts` | Resolución por MovementType | — | Arquitectura | Cada tipo de movimiento delega al handler correcto |
| `InventoryService.test.ts` | Alerta crítica bajo mínimo | CP-27, N2026-30 | RF-22 | Genera alerta cuando stock es menor o igual al mínimo |
| `InventoryService.test.ts` | Sin alertas si hay stock suficiente | CP-27 | RF-22 | Evita alertas cuando no corresponden |
| `InventoryService.test.ts` | FEFO: lote que vence primero | N2026-4 | Rotación FEFO | Elige el lote con expirationDate más cercana |
| `InventoryService.test.ts` | FEFO: excluye lotes sin stock o sin fecha | N2026-4 | Rotación FEFO | Solo lotes elegibles entran en la rotación |
| `UserService.test.ts` | Registro con bcrypt | CP-19 | RF-15, RF-16, RNF-03 | La contraseña no se guarda en texto plano |
| `UserService.test.ts` | Email duplicado | CP-19 | RF-15 | No se crean dos usuarios con el mismo email |
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
| `api/users.integration.test.ts` | Sin sesión activa | CP-20 | RF-16, RNF-03 | Omitido; ver sección 2 |
| `api/users.integration.test.ts` | Usuario no Admin intenta crear Admin | CP-20 | RF-16, RNF-03 | Omitido; ver sección 2 |

---

### 1.3 Casos del plan aún sin automatización completa

| CP | Descripción | RF | Estado |
|----|-------------|-----|--------|
| CP-01 | Registro de producto válido | RF-01 | Parcial (integración Zod y 201) |
| CP-02 | Código duplicado | RF-01 | Pendiente |
| CP-03 | Serial en Electroterapia | RF-01 | Pendiente |
| CP-04 | Consulta, filtrado y búsqueda | RF-02 a RF-04 | Parcial (GET inventario) |
| CP-05 | Anulación exitosa | RNF-06 | Manual |
| CP-06 | Doble anulación (idempotencia) | RNF-06 | Pendiente |
| CP-07 | Entrada incrementa stock | RF-05 | Pendiente |
| CP-08 | Anulación de entrada | RF-05, RF-17 | Manual |
| CP-09 | Observación por producto dañado | RF-06 | Pendiente |
| CP-12 | Salida por daño y vencimiento | RF-07 | Pendiente |
| CP-13 | Edición de despacho por turno | RF-10 | Pendiente |
| CP-14 | Traslado bodega a vitrina | RF-11 | Pendiente |
| CP-20 | Visualizador no puede editar | RF-16 | Parcial (tests omitidos) |
| CP-21 | Registro automático en auditoría | RF-17 | Pendiente |
| CP-22 | Consulta de auditoría por filtros | RF-18 | Pendiente |
| CP-23 | Soft Delete (ADR-006) | RNF-06 | Manual, con cobertura parcial en auth |
| CP-24 | Registro de cliente | RF-19 | Pendiente |
| CP-25 | Cliente obligatorio en venta | RF-20 | Automatizado (VentaHandler) |
| CP-26 | Dashboard con KPIs | RF-21 | Pendiente |
| CP-28 | Advertencia de refrigeración | RF-23 | Pendiente |
| CP-29 | Flujo Entrada, Venta, Auditoría | RF-05, RF-07, RF-17 | Pendiente |
| CP-30 | Flujo Venta, Devolución, Stock | RF-12 | Pendiente |
| CP-31 | Usabilidad, seguridad y trazabilidad | RNF-01, RNF-03, RNF-06 | Parcial (auth) |

---

## 2. Informe de casos fallidos y omitidos

**Última ejecución:** 7 de junio de 2026  
**Comando:** `npm test`

### 2.1 Casos fallidos

En este momento no hay pruebas fallando. Los 40 casos activos pasan correctamente.

### 2.2 Casos omitidos

Hay dos pruebas marcadas con `it.skip` en `api/users.integration.test.ts`:

**1. Denegar creación de ADMIN sin sesión**

- **Test:** *Debe denegar la creación de un rol ADMIN si el usuario actual NO está logueado*
- **Qué pasó:** El test se escribió cuando `UserController` aún no validaba la sesión. Después se corrigió el defecto DEF-001 con `requireRoles(ADMIN_ONLY)`, pero el test quedó deshabilitado.
- **Qué falta:** Quitar el `skip`, correr de nuevo y confirmar que responde 401 con `{ error: 'No autorizado' }`.

**2. Denegar creación de ADMIN por usuario sin rol Admin**

- **Test:** *Debe denegar la creación de un rol ADMIN si el usuario actual NO es ADMIN*
- **Qué pasó:** El controlador ya responde 403, pero el mensaje cambió. El test espera `'Solo un Admin puede crear usuarios con este rol'` y ahora `requireRoles()` devuelve `'Acceso prohibido'` con un campo `details`.
- **Qué falta:** Ajustar las aserciones al contrato actual de `permissions.ts` y reactivar el test.

En ambos casos la protección en código parece estar bien; lo que falta es alinear los tests con la implementación actual.

### 2.3 Brechas que no son fallos, pero sí riesgo

| Brecha | Por qué importa | CP / RN afectados |
|--------|-----------------|-------------------|
| FEFO no conectado a VentaHandler | El servicio elige el lote correcto, pero la venta descuenta stock global del producto | N2026-4 |
| Sin pruebas de anulación e idempotencia | La trazabilidad (RNF-06) no se verifica de forma automática | CP-05, CP-06, CP-23 |
| Sin pruebas del rol Visualizador | No confirmamos que un visualizador no pueda escribir en la API | CP-20 |
| Sin flujos E2E con Supertest | Entrada-Venta-Auditoría y Venta-Devolución no están automatizados | CP-29, CP-30 |

---

## 3. Informe de defectos del ciclo de desarrollo

Registro de los problemas encontrados durante QA. Incluye severidad, prioridad y estado actual.

| ID | Descripción | Severidad | Prioridad | CP / RF | Estado | Evidencia |
|----|-------------|-----------|-----------|---------|--------|-----------|
| DEF-001 | Escalada de privilegios en POST /api/v1/users: cualquier cliente podía crear usuarios ADMIN sin sesión ni validación de rol | Crítica | P0 | CP-19, CP-20, RF-16, RNF-03 | Resuelto | Se agregó requireRoles(ADMIN_ONLY) en UserController. Test activo: Admin crea Admin responde 201 |
| DEF-002 | Dos tests de autorización quedaron en skip tras el refactor de permissions.ts | Baja | P2 | CP-20, RNF-03 | En progreso | users.integration.test.ts, líneas 41-67 |
| DEF-003 | FEFO solo consulta el lote correcto; VentaHandler no lo usa al despachar | Media | P1 | N2026-4 | Abierto | Test unitario de FEFO pasa; falta integrarlo en salidas |
| DEF-004 | El plan documenta isActive en movimientos; la entidad Movement usa isAnnulled | Baja | P3 | CP-05, CP-23, RNF-06 | Abierto | Revisar entidad Movement frente al plan CP-23 |
| DEF-005 | inventory.integration.test.ts usa campos como unitType que pueden no existir en el DTO real; pasa porque el servicio está mockeado | Baja | P3 | CP-01, RF-01 | Abierto | inventory.integration.test.ts |

---

### Detalle de DEF-001 (escalada de roles)

Este fue el hallazgo más grave del ciclo.

| Campo | Detalle |
|-------|---------|
| Componente | UserController.createUser, ruta POST /api/v1/users |
| Cómo se reproducía | Enviar POST sin cookie de sesión, o con rol Despachador/Visualizador, pidiendo crear un usuario ADMIN |
| Impacto | Cualquier persona con acceso al endpoint podía obtener privilegios administrativos |
| Corrección | requireRoles([UserRole.ADMIN]) en todos los métodos de UserController, vía permissions.ts |
| Verificación actual | El test de Admin crea Admin pasa con status 201 |
| Pendiente | Reactivar los dos tests omitidos para cubrir 401 y 403 |

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
| 2026-06-07 | npm test | 40 pasaron, 2 omitidas, 0 fallaron | Documentación inicial |
| 2026-06-07 | npm test -- __tests__/services | 33 pasaron, 0 omitidas | Solo pruebas unitarias de servicios |

---

## 5. Referencias

- Estructura y comandos: `DOCUMENTACION-PRUEBAS.md`
- Plan de casos manuales: `PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf`
- Permisos y roles: `src/lib/permissions.ts`
- Handlers de movimientos: `src/service/movement/handlers/`
