# Stockly — Entregables de Pruebas (Segundo Corte)

Este repositorio contiene los artefactos de Calidad de Software (QA), matrices de trazabilidad, informes de defectos y reportes dinámicos de cobertura de código correspondientes a la evaluación del Segundo Corte del Proyecto Nuclear N2026.

> **Nota de Diseño:** Este repositorio se mantiene independiente de la base de código principal para evitar la sobrecarga de archivos estáticos históricos (`lcov-report`) y asegurar que el repositorio de producción permanezca limpio, ligero y escalable.

## Enlaces Operativos Críticos
* **Repositorio de Código Fuente Principal:** [Repositorio Oficial Stockly](https://github.com/nsantg/stockly)
* **Tablero de Control Académico:** [Backlog Jira N2026](https://stly.atlassian.net/jira/software/projects/N2026/boards/34/backlog)

---

## Contenido de este Entregable

### 1. Reporte de Cobertura de Código (Code Coverage)
Generado automáticamente mediante la suite de pruebas unitarias técnicas integradas con Jest.
* **Blindaje del Núcleo:** Los Módulos Críticos de Negocio (`src/service/movement/handlers`) se encuentran cubiertos al **95.27% en sentencias** y **100% en funciones**.

### 2. Informe de Defectos (Ciclos de Desarrollo)
Documentación exhaustiva de hallazgos críticos detectados durante las pruebas automatizadas y manuales, destacando la resolución del defecto `DEF-001` (Escalada de privilegios de seguridad en el endpoint de creación de usuarios administradores).

### 3. Matriz de Trazabilidad
Mapeo formal uno a uno entre los Requisitos Funcionales concertados interdisciplinariamente con el área de **Ingeniería Industrial** (flujos de almacenamiento en bodega/vitrina, restricciones de productos eléctricos de Electroterapia) y los Casos de Prueba (`CP-XX`) automatizados en código.

---

##  Instrucciones de Visualización Local
Si deseas examinar la cobertura de pruebas de forma local sin usar el despliegue estático, clona este repositorio y abre el archivo raíz del reporte en tu navegador:
```bash

open index.html

## Pruebas automatizadas

**Carpetas relevantes**
- `__bdd__`: contiene las pruebas BDD (features, steps y documentación). Ver `__bdd__/DOCUMENTACION-PRUEBAS-BDD.md`.
- `__tests__`: contiene las pruebas unitarias y de integración organizadas por carpeta (`api`, `services`, `repository`, `integration`, `helpers`). Ver `__tests__/DOCUMENTACION-PRUEBAS.md` y `__tests__/integration/DOCUMENTACION-PRUEBAS-INTEGRACION.md`.

**Comandos útiles**
Para ejecutar todas las pruebas unitarias:
```bash
npm test
```
Para ejecutar con reporte de cobertura:
```bash
npm run test:coverage
```
Para ejecutar solo las pruebas de integración:
```bash
npm run test:integration
```
Para ejecutar las pruebas BDD configuradas con Jest:
```bash
npm run test:bdd
```

Cómo probar localmente:
```bash
npm install
npm run test:coverage
```

Documentación de pruebas adicionales:
- `__tests__/TRAZABILIDAD-Y-REPORTES-QA.md` describe trazabilidad y reportes QA.
- `__tests__/integration/DOCUMENTACION-PRUEBAS-INTEGRACION.md` detalla los escenarios de integración.
- `__bdd__/DOCUMENTACION-PRUEBAS-BDD.md` detalla el enfoque BDD y cómo ejecutar esas pruebas.


## Equipo Nuclear 2026

Derly Elena Quejada Perea, Juan José Quintero, Maria Luisa Londoño Moncada, Nicolás Santiago Carmona, Xiomara Ocampo Hurtado y Juan Manuel Pinzon.
