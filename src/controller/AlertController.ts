import { NextRequest, NextResponse } from 'next/server';
import { alertService } from '../service/AlertService';
import { requireSession } from '../lib/permissions';
import { BusinessError } from '../lib/errors';

function handleError(error: unknown): NextResponse {
  if (error instanceof BusinessError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
}

class AlertController {
  /**
   * @swagger
   * /api/v1/alerts/stock:
   *   get:
   *     summary: Lista productos con stock crítico (por debajo del mínimo)
   *     tags:
   *       - Alerts
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Lista de alertas de stock crítico
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/StockAlert'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getStockAlerts(_request: NextRequest): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const alerts = await alertService.getStockAlerts();
      return NextResponse.json(alerts);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/alerts/expiration:
   *   get:
   *     summary: Lista lotes próximos a vencer
   *     tags:
   *       - Alerts
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 30
   *           maximum: 90
   *         description: Días hacia adelante para considerar el vencimiento (máximo 90)
   *     responses:
   *       200:
   *         description: Lista de alertas de vencimiento
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ExpirationAlert'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getExpirationAlerts(request: NextRequest): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const raw = parseInt(new URL(request.url).searchParams.get('days') ?? '30', 10);
      const days = Number.isNaN(raw) ? 30 : Math.min(raw, 90);
      const alerts = await alertService.getExpirationAlerts(days);
      return NextResponse.json(alerts);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/alerts:
   *   get:
   *     summary: Resumen consolidado de todas las alertas del sistema
   *     tags:
   *       - Alerts
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 30
   *         description: Días hacia adelante para alertas de vencimiento
   *     responses:
   *       200:
   *         description: Resumen de alertas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AlertSummary'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getAllAlerts(request: NextRequest): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const raw = parseInt(new URL(request.url).searchParams.get('days') ?? '30', 10);
      const days = Number.isNaN(raw) ? 30 : raw;
      const summary = await alertService.getAllAlerts(days);
      return NextResponse.json(summary);
    } catch (error) {
      return handleError(error);
    }
  }
}

export const alertController = new AlertController();
