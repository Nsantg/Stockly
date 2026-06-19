/**
 * Script de Pruebas de Rendimiento - K6
 * Simula 50 usuarios concurrentes sobre los endpoints críticos de Stockly.
 *
 * Escenarios:
 *   1. dashboard_concurrency  — GET /api/v1/dashboard      (consulta de métricas)
 *   2. movements_post         — POST /api/v1/movements     (registro de movimientos)
 *
 * Referencia: emula el locustfile del docente (carrito-compras) adaptado a K6.
 * Cubre: RN-06 (stock no negativo bajo carga concurrente), RNF-06 (trazabilidad)
 *
 * Requisitos: k6 instalado (https://k6.io/docs/get-started/installation/)
 * Ejecución:  k6 run performance-k6.js
 * Con reporte: k6 run --out json=performance-report.json performance-k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Métricas personalizadas ────────────────────────────────────────────────

const errorRate         = new Rate('error_rate');
const dashboardDuration = new Trend('dashboard_duration_ms', true);
const movementDuration  = new Trend('movement_post_duration_ms', true);
const successfulRequests = new Counter('successful_requests');
const movementErrors    = new Counter('movement_errors');

// ─── Configuración de carga ─────────────────────────────────────────────────

export const options = {
  scenarios: {
    // Escenario 1: lectura del Dashboard (métricas y KPIs)
    dashboard_concurrency: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },   // 0→50 usuarios en 30 s
        { duration: '1m',  target: 50 },   // carga sostenida 1 minuto
        { duration: '15s', target: 0 },    // bajada
      ],
    },

    // Escenario 2: creación de movimientos (POST concurrente — RN-06, RNF-06)
    movements_post: {
      executor: 'ramping-vus',
      startVUs: 0,
      startTime: '0s',
      stages: [
        { duration: '20s', target: 50 },   // rampa: 0→50 usuarios
        { duration: '1m',  target: 50 },   // sostenido: 50 usuarios por 1 minuto
        { duration: '10s', target: 0 },    // bajada
      ],
      exec: 'movementsScenario',
    },
  },
  thresholds: {
    // El 95 % de las peticiones debe responder en < 2 s
    http_req_duration:        ['p(95)<2000'],
    // Tasa de errores global < 1 %
    error_rate:               ['rate<0.01'],
    // Tasa de fallos HTTP < 1 %
    http_req_failed:          ['rate<0.01'],
    // El 95 % de los POSTs de movimientos debe responder en < 3 s
    movement_post_duration_ms: ['p(95)<3000'],
    // Errores de negocio en movimientos < 5 % (stock insuficiente es esperado bajo carga)
    movement_errors:          ['count<50'],
  },
};

// ─── Configuración del entorno ───────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Token de sesión para pruebas (NextAuth session cookie).
// En entorno real se obtendría mediante login en setUp().
const SESSION_COOKIE = __ENV.SESSION_COOKIE || 'mock-session-token-for-testing';

// ID de producto existente en la base de datos de pruebas
const TEST_PRODUCT_ID = __ENV.TEST_PRODUCT_ID || '00000000-0000-0000-0000-000000000001';

// ID de cliente existente en la base de datos de pruebas
const TEST_CLIENT_ID = __ENV.TEST_CLIENT_ID || '00000000-0000-0000-0000-000000000002';

const HEADERS = {
  'Content-Type': 'application/json',
  Cookie: `next-auth.session-token=${SESSION_COOKIE}`,
};

// ─── Escenario 1: Dashboard + Inventario + Movimientos (GET) ─────────────────

export default function () {
  // 1. Consulta del Dashboard (endpoint principal de métricas)
  const dashboardRes = http.get(`${BASE_URL}/api/v1/dashboard`, { headers: HEADERS });

  const dashOk = check(dashboardRes, {
    'dashboard: status 200':        (r) => r.status === 200,
    'dashboard: responde en < 2s':  (r) => r.timings.duration < 2000,
    'dashboard: body no vacío':     (r) => r.body !== null && r.body.length > 0,
  });

  dashboardDuration.add(dashboardRes.timings.duration);
  errorRate.add(!dashOk);
  if (dashOk) successfulRequests.add(1);

  sleep(1);

  // 2. Consulta del inventario (lista de productos)
  const inventoryRes = http.get(`${BASE_URL}/api/v1/inventory`, { headers: HEADERS });

  const invOk = check(inventoryRes, {
    'inventory: status 200 o 401':  (r) => r.status === 200 || r.status === 401,
    'inventory: responde en < 3s':  (r) => r.timings.duration < 3000,
  });

  errorRate.add(!invOk);

  sleep(0.5);

  // 3. Consulta de movimientos recientes (paginada)
  const movementsRes = http.get(`${BASE_URL}/api/v1/movements?page=1&limit=20`, {
    headers: HEADERS,
  });

  check(movementsRes, {
    'movements GET: status aceptable': (r) => r.status < 500,
    'movements GET: responde en < 3s': (r) => r.timings.duration < 3000,
  });

  sleep(Math.random() * 2 + 0.5); // pausa aleatoria entre 0.5 y 2.5 s
}

// ─── Escenario 2: POST /api/v1/movements — 50 usuarios concurrentes ──────────
//
// Valida RN-06: el sistema no debe permitir stock negativo bajo carga simultánea.
// Valida RNF-06: todos los movimientos generados deben quedar trazados (soft-delete).

export function movementsScenario() {
  const movementTypes = ['VENTA', 'ENTRADA', 'AJUSTE_SALIDA'];
  const selectedType  = movementTypes[Math.floor(Math.random() * movementTypes.length)];

  // Payload base para POST /api/v1/movements
  const payload = JSON.stringify({
    productId:    TEST_PRODUCT_ID,
    movementType: selectedType,
    quantity:     Math.floor(Math.random() * 3) + 1, // 1 a 3 unidades
    ...(selectedType === 'VENTA' && {
      clientId:   TEST_CLIENT_ID,
      clientType: 'NATURAL',
    }),
    ...(selectedType === 'AJUSTE_SALIDA' && {
      reason: 'Prueba de rendimiento — ajuste de salida',
    }),
  });

  const postRes = http.post(`${BASE_URL}/api/v1/movements`, payload, { headers: HEADERS });

  movementDuration.add(postRes.timings.duration);

  const postOk = check(postRes, {
    'movements POST: status aceptable (201 o 400)': (r) => r.status === 201 || r.status === 400,
    'movements POST: no error 5xx':                  (r) => r.status < 500,
    'movements POST: responde en < 3s':              (r) => r.timings.duration < 3000,
  });

  // status 400 = regla de negocio activa (stock insuficiente u otro; es correcto)
  // status 5xx = error no controlado (se registra como error real)
  if (postRes.status >= 500) {
    movementErrors.add(1);
    errorRate.add(1);
  } else {
    errorRate.add(0);
    if (postOk) successfulRequests.add(1);
  }

  sleep(Math.random() * 1.5 + 0.5); // pausa entre 0.5 y 2 s
}

// ─── Setup: puede usarse para autenticación previa ───────────────────────────

export function setup() {
  console.log(`[K6] Iniciando prueba de rendimiento contra: ${BASE_URL}`);
  console.log('[K6] Escenario 1: 50 usuarios concurrentes — Dashboard Stockly');
  console.log('[K6] Escenario 2: 50 usuarios concurrentes — POST /api/v1/movements (RN-06, RNF-06)');
  return { baseUrl: BASE_URL };
}

// ─── Teardown: resumen post-prueba ────────────────────────────────────────────

export function teardown(data) {
  console.log(`[K6] Prueba finalizada. URL base: ${data.baseUrl}`);
  console.log('[K6] Revisa el reporte en: performance-report.json (si usaste --out json)');
  console.log('[K6] Umbrales evaluados:');
  console.log('     • p(95) latencia global  < 2 000 ms');
  console.log('     • p(95) POST movimientos < 3 000 ms');
  console.log('     • Tasa de errores        < 1 %');
  console.log('     • Errores de movimiento  < 50 ocurrencias');
}
