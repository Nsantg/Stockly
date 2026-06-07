# Documentación de pruebas BDD — Stockly

**Proyecto:** Nuclear 2026 (N2026), gestor de inventario Stockly  
**Asignatura:** Pruebas de Software | Arquitectura de Software | Programación con tecnologías web  
**Plan de referencia:** `__tests__/PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf`  
**Última ejecución registrada:** 7 de junio de 2026 — 5 escenarios pasaron, ninguno omitido ni fallido

---

## Para qué sirve esta carpeta

La suite BDD (Behavior Driven Development) vive en `__bdd__/`, **separada** de las pruebas técnicas en `__tests__/`. Aquí los casos se escriben en lenguaje Gherkin en español, orientado a negocio y operaciones logísticas, y se ejecutan con **jest-cucumber**.

El objetivo es que analistas, QA y desarrolladores lean los mismos escenarios: qué pasa cuando se despacha una venta, se rechaza por stock, se devuelve un producto o se anula un movimiento con trazabilidad.

Las pruebas técnicas (`npm test`) siguen siendo la suite principal de regresión unitaria e integración. La suite BDD (`npm run test:bdd`) complementa esa cobertura con flujos narrados en `.feature`.

---

## Instalación

Dependencia de desarrollo:

```bash
npm install -D jest-cucumber
```

Ya está instalada en el proyecto (`jest-cucumber@^4.5.0`). Solo se añadió el script `test:bdd` en `package.json`. No modifica `jest.config.js` ni la suite en `__tests__/`.

---

## Herramientas que usamos

| Herramienta | Para qué la usamos |
|-------------|-------------------|
| **jest-cucumber** | Enlaza archivos `.feature` (Gherkin) con step definitions en TypeScript |
| **Jest** | Motor de ejecución (configuración propia en `jest.bdd.config.js`) |
| **ts-jest** | Compilar TypeScript en los steps |
| **Gherkin (es)** | Escenarios legibles por negocio; `# language: es` en cada feature |
| **Handlers / MovementService** | Misma lógica de dominio que producción, sin PostgreSQL real |

Configuración exclusiva BDD en la raíz del proyecto:

```javascript
// jest.bdd.config.js
preset: 'ts-jest'
testEnvironment: 'node'
roots: ['<rootDir>/__bdd__']
testMatch: ['**/__bdd__/steps/**/*.steps.ts']
moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }
```

El archivo `__bdd__/cucumber.js` es referencia para un ejecutor nativo `@cucumber/cucumber` en el futuro; hoy la suite corre con `npm run test:bdd`.

---

## Cómo está organizada la carpeta

```
__bdd__/
├── DOCUMENTACION-PRUEBAS-BDD.md     (este documento)
├── TRAZABILIDAD-Y-REPORTES-BDD.md   (matriz escenario vs CP/RF/RN)
├── cucumber.js                      referencia Cucumber nativo (futuro)
│
├── features/                        escenarios Gherkin
│   ├── venta.feature
│   ├── devoluciones.feature
│   └── trazabilidad.feature
│
├── steps/                           step definitions (jest-cucumber)
│   ├── venta.steps.ts
│   ├── devoluciones.steps.ts
│   └── trazabilidad.steps.ts
│
├── support/
│   ├── context/
│   │   └── ScenarioContext.ts       estado compartido entre pasos
│   └── helpers/
│       ├── productFactory.ts        productos Electroterapia / Masoterapia
│       ├── movementDtoFactory.ts    DTOs de venta y devolución
│       └── queryRunnerMock.ts       transacción simulada
│
└── types/
    └── feature.d.ts                 tipos para imports de .feature
```

---

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run test:bdd` | Ejecuta solo la suite BDD (5 escenarios) |
| `npm test` | Suite técnica original en `__tests__/` (sin cambios) |

Ejecutar un flujo concreto:

```bash
npm run test:bdd -- __bdd__/steps/venta.steps.ts
```

Modo verbose (ya activo en `jest.bdd.config.js`):

```bash
npm run test:bdd -- --verbose
```

---

## Flujos cubiertos

### Flujo 1 — Venta (`venta.feature`)

| Escenario | CP | Regla | Resultado esperado |
|-----------|-----|-------|-------------------|
| Despacho exitoso que descuenta stock | CP-10 | — | Stock 50 → 45; venta con cliente |
| Despacho rechazado por stock insuficiente | CP-11 | RN-06 | Rechazo; stock permanece en 3 |

**Implementación:** `VentaHandler.validate()` y `VentaHandler.execute()` con `QueryRunner` mock.

### Flujo 2 — Devoluciones (`devoluciones.feature`)

| Escenario | CP | Regla | Resultado esperado |
|-----------|-----|-------|-------------------|
| Devolución aceptada para Electroterapia | CP-15 | RN-04 | Stock 10 → 11 |
| Devolución rechazada para Masoterapia | CP-16 | RN-04 | Rechazo; stock sin cambios |

**Implementación:** `DevolucionHandler` con productos `allowsSerialNumber: true/false`.

### Flujo 3 — Trazabilidad (`trazabilidad.feature`)

| Escenario | CP / RNF | Regla | Resultado esperado |
|-----------|----------|-------|-------------------|
| Anulación de movimiento con soft delete | CP-05, CP-08, CP-23 / RNF-06 | Soft delete | `isAnnulled = true`; motivo y fecha; registro persiste; stock 45 → 50 |

**Implementación:** `movementService.annulMovement()` con mocks de `movementRepository`, `getDataSource` y `QueryRunner`.

---

## Arquitectura (SOLID y aislamiento)

| Principio | Cómo se aplica |
|-----------|----------------|
| **Single Responsibility** | Factories (`productFactory`, `movementDtoFactory`) separadas de los steps |
| **Handlers directos** | Venta y devolución invocan handlers sin base de datos |
| **Mocks en trazabilidad** | `movementRepository`, `getDataSource` y `QueryRunner` simulan la transacción de anulación |
| **Contexto compartido** | `ScenarioContext` guarda producto, DTO, error, movimiento anulado entre pasos Gherkin |
| **Aislamiento de suites** | `__tests__/` y `jest.config.js` no se modificaron para BDD |

Los mensajes de error verificados en los steps coinciden con los del dominio real (por ejemplo, `Stock insuficiente`, `productos eléctricos`).

---

## Ejemplo de escenario Gherkin

```gherkin
# language: es
Escenario: Despacho rechazado por stock insuficiente
  Dado un producto "Electrodo TENS" con stock disponible de 3 unidades
  Y un cliente registrado para venta al detalle
  Cuando intento registrar un despacho de venta por 10 unidades
  Entonces el sistema rechaza la operación
  Y el mensaje indica stock insuficiente
  Y el stock del producto permanece en 3 unidades
```

Los step definitions en `venta.steps.ts` traducen cada paso a llamadas a `VentaHandler` y aserciones sobre `ctx.product.stock` y `ctx.error`.

---

## Relación con las otras suites

| Aspecto | BDD (`__bdd__/`) | Técnica (`__tests__/`) | Integración API |
|---------|------------------|------------------------|-----------------|
| Lenguaje | Gherkin en español | `describe` / `it` | `describe` / `it` + AAA |
| Audiencia | Negocio, QA, docente | Desarrolladores | QA / backend |
| Cobertura | 5 escenarios | 59 casos | 7 pruebas HTTP + BD |
| Comando | `npm run test:bdd` | `npm test` | `npm run test:integration` |
| BD real | No | No | Sí (`stockly_test`) |
| HTTP Supertest | No | Parcial (mocks) | Sí |

Las tres suites se complementan. La integración valida lo que BDD y unitarias no pueden: persistencia real en PostgreSQL y rutas API completas. Ver `__tests__/integration/DOCUMENTACION-PRUEBAS-INTEGRACION.md`.

---

## Cómo agregar un escenario nuevo

1. Escribir el escenario en `features/<modulo>.feature` con tags (`@cp-XX`).
2. Implementar o reutilizar steps en `steps/<modulo>.steps.ts` con `defineFeature`.
3. Usar factories en `support/helpers/` para datos de prueba.
4. Compartir estado con `ScenarioContext` entre pasos.
5. Actualizar `TRAZABILIDAD-Y-REPORTES-BDD.md`.
6. Verificar: `npm run test:bdd` y que `npm test` siga pasando.

---

## Documentos relacionados

| Documento | Ubicación |
|-----------|-----------|
| Plan de pruebas oficial | `__tests__/PT-DCP-01-Plan y Casos De Prueba Nuclear2026 (3) (2).pdf` |
| Matriz BDD (escenarios vs CP) | `__bdd__/TRAZABILIDAD-Y-REPORTES-BDD.md` |
| Documentación suite técnica | `__tests__/DOCUMENTACION-PRUEBAS.md` |
| Documentación integración API | `__tests__/integration/DOCUMENTACION-PRUEBAS-INTEGRACION.md` |
| Matriz técnica y defectos | `__tests__/TRAZABILIDAD-Y-REPORTES-QA.md` |
| Config BDD | `jest.bdd.config.js` |

---

## Equipo Nuclear 2026

Derly Elena Quejada Perea, Juan José Quintero, Maria Luisa Londoño Moncada, Nicolás Santiago Carmona, Xiomara Ocampo Hurtado y Juan Manuel Pinzon.
