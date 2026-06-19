import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '../service/DashboardService';
import { requireSession } from '../lib/permissions';
import { BusinessError } from '../lib/errors';

function handleError(error: unknown): NextResponse {
  if (error instanceof BusinessError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
}

function parseIsoDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

class DashboardController {
  /**
   * @swagger
   * /api/v1/dashboard:
   *   get:
   *     summary: KPIs del dashboard de inventario
   *     tags:
   *       - Dashboard
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha de inicio del período (ISO 8601, opcional)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha de fin del período (ISO 8601, opcional)
   *     responses:
   *       200:
   *         description: KPIs del dashboard
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DashboardKpis'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getKpis(request: NextRequest): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const { searchParams } = new URL(request.url);
      const startRaw = searchParams.get('startDate');
      const endRaw = searchParams.get('endDate');

      if (startRaw !== null) {
        const parsed = parseIsoDate(startRaw);
        if (parsed === null) {
          return NextResponse.json(
            { error: 'Fecha inválida', details: `startDate "${startRaw}" no es una fecha ISO válida` },
            { status: 400 },
          );
        }
      }
      if (endRaw !== null) {
        const parsed = parseIsoDate(endRaw);
        if (parsed === null) {
          return NextResponse.json(
            { error: 'Fecha inválida', details: `endDate "${endRaw}" no es una fecha ISO válida` },
            { status: 400 },
          );
        }
      }

      const filter = {
        startDate: startRaw ? (parseIsoDate(startRaw) as Date) : undefined,
        endDate: endRaw ? (parseIsoDate(endRaw) as Date) : undefined,
      };

      const kpis = await dashboardService.getAllKpis(filter);
      return NextResponse.json(kpis);
    } catch (error) {
      return handleError(error);
    }
  }
}

export const dashboardController = new DashboardController();
