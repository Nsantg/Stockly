import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { settingsService } from '../service/SettingsService';
import { requireSession, requireRoles } from '../lib/permissions';
import { UserRole } from '../entity/UserRole';
import { BusinessError } from '../lib/errors';

function handleError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  if (error instanceof BusinessError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
}

class SettingsController {
  /**
   * @swagger
   * /api/v1/settings:
   *   get:
   *     summary: Obtiene la configuración general del sistema
   *     tags:
   *       - Settings
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Configuración actual
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Settings'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async get(): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const settings = await settingsService.getSettings();
      return NextResponse.json(settings);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/settings:
   *   put:
   *     summary: Actualiza la configuración general del sistema (solo Admin)
   *     tags:
   *       - Settings
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Configuración actualizada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Settings'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async update(request: NextRequest): Promise<NextResponse> {
    const auth = await requireRoles([UserRole.ADMIN]);
    if (!auth.ok) return auth.response;

    try {
      const body = await request.json();
      const settings = await settingsService.updateSettings(body);
      return NextResponse.json(settings);
    } catch (error) {
      return handleError(error);
    }
  }
}

export const settingsController = new SettingsController();
