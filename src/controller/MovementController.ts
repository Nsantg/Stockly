import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { movementService } from '../service/MovementService';
import {
  requireSession,
  requireRoles,
  ANNUL_AND_EDIT_ROLES,
  MOVEMENT_TYPE_ROLES,
} from '../lib/permissions';
import { UserRole } from '../entity/UserRole';
import { MovementType } from '../entity/MovementType';
import { BusinessError } from '../lib/errors';

const EVIDENCE_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.ALMACENISTA, UserRole.DESPACHADOR];

function handleError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('no encontrado');
}

function stripUserPassword(user: Record<string, unknown> | null | undefined) {
  if (!user) return user;
  const { password: _p, ...safe } = user;
  return safe;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeMovement(m: any) {
  return {
    ...m,
    user: stripUserPassword(m.user),
    annulledBy: stripUserPassword(m.annulledBy),
  };
}

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

class MovementController {
  /**
   * @swagger
   * /api/v1/movements:
   *   get:
   *     summary: Lista movimientos con filtros y paginación
   *     tags:
   *       - Movements
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: productId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: type
   *         schema:
   *           $ref: '#/components/schemas/MovementType'
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Lista paginada de movimientos
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getMovements(request: NextRequest): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const { searchParams } = new URL(request.url);
      const typeParam = searchParams.get('type');
      const isAnnulledParam = searchParams.get('isAnnulled');
      const filters = {
        productId: searchParams.get('productId') ?? undefined,
        userId: searchParams.get('userId') ?? undefined,
        type: typeParam ? (typeParam as MovementType) : undefined,
        startDate: parseDate(searchParams.get('startDate')),
        endDate: parseDate(searchParams.get('endDate')),
        isAnnulled: isAnnulledParam !== null ? isAnnulledParam === 'true' : undefined,
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
      };
      const result = await movementService.getMovements(filters);
      return NextResponse.json({ ...result, data: result.data.map(sanitizeMovement) });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/movements:
   *   post:
   *     summary: Registra un nuevo movimiento de inventario
   *     tags:
   *       - Movements
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateMovementDto'
   *     responses:
   *       201:
   *         description: Movimiento registrado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Movement'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async createMovement(request: NextRequest): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const body = await request.json();
      const allowed = MOVEMENT_TYPE_ROLES[body?.type as MovementType];
      if (allowed && !allowed.includes(auth.session.user.rol as UserRole)) {
        return NextResponse.json(
          {
            error: 'Acceso prohibido',
            details: `Esta operación requiere uno de los siguientes roles: ${allowed.join(', ')}`,
          },
          { status: 403 },
        );
      }

      const result = await movementService.createMovement({
        ...body,
        userId: auth.session.user.id,
      });
      return NextResponse.json(
        { movement: sanitizeMovement(result.movement), warning: result.warning },
        { status: 201 },
      );
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/movements/{id}:
   *   get:
   *     summary: Obtiene un movimiento por ID
   *     tags:
   *       - Movements
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Movimiento encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Movement'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getMovementById(_request: NextRequest, id: string): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const movement = await movementService.getMovementById(id);
      return NextResponse.json(sanitizeMovement(movement));
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json({ error: (error as Error).message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/movements/{id}/annul:
   *   patch:
   *     summary: Anula un movimiento y revierte su efecto en el stock
   *     tags:
   *       - Movements
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AnnulMovementDto'
   *     responses:
   *       200:
   *         description: Movimiento anulado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Movement'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async annulMovement(request: NextRequest, id: string): Promise<NextResponse> {
    const auth = await requireRoles(ANNUL_AND_EDIT_ROLES);
    if (!auth.ok) return auth.response;

    try {
      const body = await request.json();
      const movement = await movementService.annulMovement(id, {
        reason: body?.reason,
        userId: auth.session.user.id,
      });
      return NextResponse.json(sanitizeMovement(movement));
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json({ error: (error as Error).message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/movements/{id}/dispatch:
   *   put:
   *     summary: Edita un despacho (movimiento de venta) dentro del mismo turno
   *     tags:
   *       - Movements
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/EditDispatchDto'
   *     responses:
   *       200:
   *         description: Despacho actualizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Movement'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async editDispatch(request: NextRequest, id: string): Promise<NextResponse> {
    const auth = await requireRoles(ANNUL_AND_EDIT_ROLES);
    if (!auth.ok) return auth.response;

    try {
      const body = await request.json();
      const movement = await movementService.editDispatch(id, body, auth.session.user.id);
      return NextResponse.json(sanitizeMovement(movement));
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json({ error: (error as Error).message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/movements/export:
   *   get:
   *     summary: Obtener todos los movimientos para exportación sin paginación
   *     tags:
   *       - Movements
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           $ref: '#/components/schemas/MovementType'
   *       - in: query
   *         name: productId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: isAnnulled
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Array completo de movimientos sin paginación
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async exportMovements(request: NextRequest): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const { searchParams } = new URL(request.url);
      const typeParam = searchParams.get('type');
      const isAnnulledParam = searchParams.get('isAnnulled');
      const filters = {
        productId: searchParams.get('productId') ?? undefined,
        userId: searchParams.get('userId') ?? undefined,
        type: typeParam ? (typeParam as MovementType) : undefined,
        startDate: parseDate(searchParams.get('startDate')),
        endDate: parseDate(searchParams.get('endDate')),
        isAnnulled: isAnnulledParam !== null ? isAnnulledParam === 'true' : undefined,
      };
      const movements = await movementService.getMovementsForExport(filters);
      return NextResponse.json(movements.map(sanitizeMovement));
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/movements/product/{productId}:
   *   get:
   *     summary: Historial de movimientos de un producto
   *     tags:
   *       - Movements
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Lista de movimientos del producto
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Movement'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getMovementsByProduct(_request: NextRequest, productId: string): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const movements = await movementService.getMovementsByProduct(productId);
      return NextResponse.json(movements.map(sanitizeMovement));
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/movements/user/{userId}:
   *   get:
   *     summary: Historial de movimientos registrados por un usuario
   *     tags:
   *       - Movements
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Lista de movimientos del usuario
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Movement'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getMovementsByUser(_request: NextRequest, userId: string): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const movements = await movementService.getMovementsByUser(userId);
      return NextResponse.json(movements.map(sanitizeMovement));
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/movements/{id}/evidence:
   *   post:
   *     summary: Sube evidencia fotográfica para un movimiento de tipo salida
   *     tags:
   *       - Movements
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - file
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: Imagen en formato JPEG, PNG o WebP (máx. 5 MB)
   *     responses:
   *       200:
   *         description: Evidencia subida correctamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Movement'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async uploadEvidence(request: NextRequest, id: string): Promise<NextResponse> {
    const auth = await requireRoles(EVIDENCE_ROLES);
    if (!auth.ok) return auth.response;

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'El archivo no puede superar 10MB' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const movement = await movementService.uploadEvidence(id, buffer, file.type);
      return NextResponse.json(sanitizeMovement(movement));
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json({ error: (error as Error).message }, { status: 404 });
      }
      return handleError(error);
    }
  }
}

export const movementController = new MovementController();
