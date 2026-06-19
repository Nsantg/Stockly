/**
 * Script de Pruebas de Rendimiento - K6
 * Simula 50 usuarios concurrentes consultando el Dashboard de Stockly.
 *
 * Referencia: emula el locustfile del docente (carrito-compras) adaptado a K6.
 *
 * Requisitos: k6 instalado (https://k6.io/docs/get-started/installation/)
 * Ejecución:  k6 run performance-k6.js
 * Con reporte: k6 run --out json=performance-report.json performance-k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Métricas personalizadas ────────────────────────────────────────────────

const errorRate = new Rate('error_rate');
const dashboardDuration = new Trend('dashboard_duration_ms', true);
const successfulRequests = new Counter('successful_requests');

// ─── Configuración de carga ─────────────────────────────────────────────────

export const options = {
  scenarios: {
    dashboard_concurrency: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },   // Rampa de subida: 0→50 usuarios en 30s
        { duration: '1m',  target: 50 },   // Carga sostenida: 50 usuarios por 1 minuto
        { duration: '15s', target: 0 },    // Rampa de bajada: 50→0 usuarios en 15s
      ],
    },
  },
  thresholds: {
    // El 95% de las peticiones debe responder en menos de 2 segundos
    http_req_duration: ['p(95)<2000'],
    // La tasa de errores debe ser inferior al 1%
    error_rate: ['rate<0.01'],
    // Al menos el 99% de las peticiones deben tener status 2xx
    http_req_failed: ['rate<0.01'],
  },
};

// ─── Configuración del entorno ───────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Token de sesión para pruebas (NextAuth session cookie)
// En entorno real, se obtendría mediante login en setUp()
const SESSION_COOKIE = __ENV.SESSION_COOKIE || 'mock-session-token-for-testing';

const HEADERS = {
  'Content-Type': 'application/json',
  Cookie: `next-auth.session-token=${SESSION_COOKIE}`,
};

// ─── Escenario principal ─────────────────────────────────────────────────────

export default function () {
  // 1. Consulta del Dashboard (endpoint principal de métricas)
  const dashboardRes = http.get(`${BASE_URL}/api/v1/dashboard`, { headers: HEADERS });

  const dashOk = check(dashboardRes, {
    'dashboard: status 200': (r) => r.status === 200,
    'dashboard: responde en < 2s': (r) => r.timings.duration < 2000,
    'dashboard: body no vacío': (r) => r.body !== null && r.body.length > 0,
  });

  dashboardDuration.add(dashboardRes.timings.duration);
  errorRate.add(!dashOk);
  if (dashOk) successfulRequests.add(1);

  sleep(1);

  // 2. Consulta del inventario (lista de productos)
  const inventoryRes = http.get(`${BASE_URL}/api/v1/inventory`, { headers: HEADERS });

  const invOk = check(inventoryRes, {
    'inventory: status 200 o 401': (r) => r.status === 200 || r.status === 401,
    'inventory: responde en < 3s': (r) => r.timings.duration < 3000,
  });

  errorRate.add(!invOk);

  sleep(0.5);

  // 3. Consulta de movimientos recientes
  const movementsRes = http.get(`${BASE_URL}/api/v1/movements?page=1&limit=20`, {
    headers: HEADERS,
  });

  check(movementsRes, {
    'movements: status aceptable': (r) => r.status < 500,
    'movements: responde en < 3s': (r) => r.timings.duration < 3000,
  });

  sleep(Math.random() * 2 + 0.5); // Pausa aleatoria entre 0.5 y 2.5 segundos
}

// ─── Setup: puede usarse para autenticación previa ───────────────────────────

export function setup() {
  console.log(`[K6] Iniciando prueba de rendimiento contra: ${BASE_URL}`);
  console.log('[K6] Escenario: 50 usuarios concurrentes - Dashboard Stockly');
  return { baseUrl: BASE_URL };
}

// ─── Teardown: resumen post-prueba ────────────────────────────────────────────

export function teardown(data) {
  console.log(`[K6] Prueba finalizada. URL base: ${data.baseUrl}`);
  console.log('[K6] Revisa el reporte en: performance-report.json (si usaste --out json)');
}
