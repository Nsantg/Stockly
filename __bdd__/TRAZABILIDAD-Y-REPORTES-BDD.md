# Trazabilidad y reportes QA — Suite BDD Stockly

**Plan:** PT-DCP-01 v1.0  
**Fecha del reporte:** 7 de junio de 2026  
**Comando:** `npm run test:bdd`  
**Estado:** 5 escenarios pasaron, ninguno omitido ni fallido

---

## 1. Matriz de trazabilidad (Gherkin vs. requisitos)

Relaciona cada escenario `.feature` con casos de prueba (CP), requisitos funcionales (RF), reglas de negocio (RN) y requisitos no funcionales (RNF) del plan PT-DCP-01.

### Leyenda

| Estado | Significado |
|--------|-------------|
| Automatizado BDD | Escenario ejecutado con jest-cucumber |
| Cubierto también en `__tests__/` | Misma regla probada en suite técnica |
| Manual | Solo en plan PT-DCP-01, ejecución en QA/Staging |
| Pendiente BDD | Aún no hay escenario Gherkin |

---

### 1.1 Escenarios por feature

| Feature | Escenario | Tags | CP | RF / RN / RNF | Step file | Qué valida |
|---------|-----------|------|-----|---------------|-----------|------------|
| `venta.feature` | Despacho exitoso que descuenta stock | `@cp-10` | CP-10 | RF-07, RF-08, RF-20 | `venta.steps.ts` | Venta con cliente; stock 50 → 45 |
| `venta.feature` | Despacho rechazado por stock insuficiente | `@cp-11` | CP-11 | RF-09, **RN-06** | `venta.steps.ts` | Rechazo; mensaje stock insuficiente; stock en 3 |
| `devoluciones.feature` | Devolución aceptada para Electroterapia | `@cp-15` | CP-15 | RF-12, **RN-04** | `devoluciones.steps.ts` | Stock 10 → 11; causa registrada |
| `devoluciones.feature` | Devolución rechazada para no eléctrico | `@cp-16` | CP-16 | RF-12, **RN-04** | `devoluciones.steps.ts` | Rechazo Masoterapia; stock sin cambios |
| `trazabilidad.feature` | Anulación con soft delete | `@cp-anulacion` | CP-05, CP-08, CP-23 | **RNF-06**, ADR-006 | `trazabilidad.steps.ts` | `isAnnulled`; motivo; fecha; stock 45 → 50 |

---

### 1.2 Componentes de código bajo prueba

| Escenario | Capa invocada | Dependencias mockeadas |
|-----------|---------------|------------------------|
| Venta (ambos) | `VentaHandler` | `QueryRunner` vía `queryRunnerMock` |
| Devoluciones (ambos) | `DevolucionHandler` | `QueryRunner` vía `queryRunnerMock` |
| Trazabilidad | `movementService.annulMovement()` | `movementRepository`, `getDataSource`, `QueryRunner` |

---

### 1.3 Cobertura BDD vs. plan PT-DCP-01

| CP | Descripción | BDD | Suite técnica (`npm test`) |
|----|-------------|-----|----------------------------|
| CP-05 | Anulación exitosa | Automatizado BDD | Manual / pendiente unitario |
| CP-08 | Anulación de entrada visible | Parcial BDD (soft delete) | Manual |
| CP-10 | Venta con cliente | Automatizado BDD | Automatizado |
| CP-11 | Stock insuficiente | Automatizado BDD | Automatizado |
| CP-15 | Devolución eléctrica | Automatizado BDD | Automatizado |
| CP-16 | Rechazo no eléctrico | Automatizado BDD | Automatizado |
| CP-23 | Validación soft delete | Automatizado BDD | Parcial (auth) |
| CP-06 | Doble anulación | Pendiente BDD | Pendiente |
| CP-29 | Flujo Entrada → Venta → Auditoría | Pendiente BDD | Pendiente |
| CP-30 | Flujo Venta → Devolución | Pendiente BDD | Pendiente |

---

### 1.4 Helpers y responsabilidad

| Archivo | Rol en trazabilidad |
|---------|---------------------|
| `productFactory.ts` | Construye productos Electroterapia (`allowsSerialNumber: true`) y Masoterapia (`false`) |
| `movementDtoFactory.ts` | DTOs de venta y devolución alineados con `CreateMovementDto` |
| `queryRunnerMock.ts` | Simula `manager.save` sin PostgreSQL |
| `ScenarioContext.ts` | Estado entre pasos: producto, error, movimiento, anulación |

---

## 2. Informe de casos fallidos y omitidos

**Última ejecución:** 7 de junio de 2026

### 2.1 Casos fallidos

No hay escenarios fallando. Los 5 pasan correctamente.

### 2.2 Casos omitidos

No hay escenarios marcados como pendientes o `skip` en la suite BDD.

### 2.3 Suite técnica (`npm test`)

La suite en `__tests__/` no fue modificada por la implementación BDD. Debe seguir ejecutándose de forma independiente con `npm test`.

---

## 3. Informe de defectos relacionados con BDD

| ID | Descripción | Severidad | Estado | Notas BDD |
|----|-------------|-----------|--------|-----------|
| DEF-001 | Escalada de roles en UserController | Crítica | Resuelto | No cubierto en BDD; cubierto en `users.integration.test.ts` |
| DEF-003 | FEFO no integrado en VentaHandler | Media | Abierto | BDD prueba stock global, no selección de lote |
| DEF-004 | `isActive` vs `isAnnulled` en plan | Baja | Abierto | BDD usa `isAnnulled` acorde a la entidad `Movement` |
| DEF-BDD-001 | Sin escenario de doble anulación (idempotencia) | Media | Abierto | CP-06 pendiente de feature Gherkin |
| DEF-BDD-002 | Sin flujos E2E multi-módulo | Baja | Abierto | CP-29 y CP-30 solo en suite técnica futura o manual |

---

## 4. Historial de ejecuciones

| Fecha | Comando | Resultado | Notas |
|-------|---------|-----------|-------|
| 2026-06-07 | npm run test:bdd | 5 pasaron, 0 fallaron | Implementación inicial BDD |
| 2026-06-07 | npm test | 59 pasaron | Suite técnica sin cambios |

---

## 5. Referencias cruzadas

- Guía BDD: `DOCUMENTACION-PRUEBAS-BDD.md`
- Suite técnica: `__tests__/DOCUMENTACION-PRUEBAS.md`
- Defectos generales del proyecto: `__tests__/TRAZABILIDAD-Y-REPORTES-QA.md`
- Features: `__bdd__/features/`
- Steps: `__bdd__/steps/`
