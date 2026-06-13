import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { movementController } from '../../src/controller/MovementController';
import { MovementType } from '../../src/entity/MovementType';
import { UserRole } from '../../src/entity/UserRole';
import * as movementServiceModule from '../../src/service/MovementService';
import * as permissionsModule from '../../src/lib/permissions';

jest.mock('../../src/service/MovementService');
jest.mock('../../src/lib/permissions', () => {
  const actual = jest.requireActual('../../src/lib/permissions');
  return {
    ...actual,
    requireSession: jest.fn(),
    requireRoles: jest.fn(),
  };
});

const mockSession = {
  ok: true,
  response: null,
  session: {
    user: { id: 'user-1', rol: UserRole.ADMIN },
  },
};

describe('MovementController', () => {
  let mockMovementService: jest.Mocked<typeof movementServiceModule.movementService>;
  let mockRequireSession: jest.Mock;
  let mockRequireRoles: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMovementService = movementServiceModule.movementService as jest.Mocked<
      typeof movementServiceModule.movementService
    >;
    mockRequireSession = permissionsModule.requireSession as jest.Mock;
    mockRequireRoles = permissionsModule.requireRoles as jest.Mock;
  });

  describe('getMovements', () => {
    it('debe retornar lista paginada de movimientos', async () => {
      mockRequireSession.mockResolvedValue(mockSession);
      mockMovementService.getMovements.mockResolvedValue({
        data: [
          { id: '1', productId: 'prod-1', type: MovementType.ENTRADA, quantity: 10 },
          { id: '2', productId: 'prod-2', type: MovementType.VENTA, quantity: 5 },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/movements?page=1&limit=20', {
        method: 'GET',
      });

      const response = await movementController.getMovements(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('debe filtrar por tipo de movimiento', async () => {
      mockRequireSession.mockResolvedValue(mockSession);
      mockMovementService.getMovements.mockResolvedValue({
        data: [{ id: '1', type: MovementType.ENTRADA, quantity: 10 }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      } as any);

      const request = new NextRequest(
        `http://localhost/api/v1/movements?type=${MovementType.ENTRADA}`,
        { method: 'GET' },
      );

      const response = await movementController.getMovements(request);

      expect(response.status).toBe(200);
      expect(mockMovementService.getMovements).toHaveBeenCalledWith(
        expect.objectContaining({ type: MovementType.ENTRADA }),
      );
    });

    it('debe filtrar por rango de fechas', async () => {
      mockRequireSession.mockResolvedValue(mockSession);
      mockMovementService.getMovements.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      } as any);

      const startDate = new Date('2024-01-01').toISOString();
      const endDate = new Date('2024-12-31').toISOString();
      const request = new NextRequest(
        `http://localhost/api/v1/movements?startDate=${startDate}&endDate=${endDate}`,
        { method: 'GET' },
      );

      const response = await movementController.getMovements(request);

      expect(response.status).toBe(200);
    });

    it('debe retornar 401 sin sesión', async () => {
      const unauthorizedResponse = new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
      });
      mockRequireSession.mockResolvedValue({ ok: false, response: unauthorizedResponse });

      const request = new NextRequest('http://localhost/api/v1/movements', {
        method: 'GET',
      });

      const response = await movementController.getMovements(request);

      expect(response.status).toBe(401);
    });
  });

  describe('createMovement', () => {
    it('debe crear un movimiento de entrada y retornar 201', async () => {
      mockRequireSession.mockResolvedValue(mockSession);
      mockMovementService.createMovement.mockResolvedValue({
        id: '1',
        productId: 'prod-1',
        type: MovementType.ENTRADA,
        quantity: 10,
        isActive: true,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/movements', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'prod-1',
          type: MovementType.ENTRADA,
          quantity: 10,
        }),
      });

      const response = await movementController.createMovement(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.type).toBe(MovementType.ENTRADA);
      expect(data.quantity).toBe(10);
    });

    it('debe retornar 403 si no tiene permisos según tipo de movimiento', async () => {
      mockRequireSession.mockResolvedValue({
        ...mockSession,
        session: { user: { id: 'user-1', rol: UserRole.DESPACHADOR } },
      });

      const request = new NextRequest('http://localhost/api/v1/movements', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'prod-1',
          type: MovementType.ENTRADA,
          quantity: 10,
        }),
      });

      const response = await movementController.createMovement(request);

      expect(response.status).toBe(403);
    });

    it('debe validar que quantity sea positivo', async () => {
      mockRequireSession.mockResolvedValue(mockSession);
      mockMovementService.createMovement.mockRejectedValue(
        new ZodError([
          {
            code: 'too_small',
            minimum: 0,
            type: 'number',
            inclusive: false,
            exact: false,
            message: 'La cantidad debe ser positiva',
            path: ['quantity'],
          },
        ]),
      );

      const request = new NextRequest('http://localhost/api/v1/movements', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'prod-1',
          type: MovementType.ENTRADA,
          quantity: -5,
        }),
      });

      const response = await movementController.createMovement(request);

      expect(response.status).toBe(400);
    });

    it('debe retornar 400 si el producto no existe', async () => {
      mockRequireSession.mockResolvedValue(mockSession);
      mockMovementService.createMovement.mockRejectedValue(new Error('Producto no encontrado'));

      const request = new NextRequest('http://localhost/api/v1/movements', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'invalid-id',
          type: MovementType.ENTRADA,
          quantity: 10,
        }),
      });

      const response = await movementController.createMovement(request);

      expect(response.status).toBe(400);
    });
  });

  describe('annulMovement', () => {
    it('debe anular un movimiento y retornar 200', async () => {
      mockRequireRoles.mockResolvedValue(mockSession);
      mockMovementService.annulMovement.mockResolvedValue({
        id: '1',
        isActive: false,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/movements/1/annul', {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Error de registro' }),
      });

      const response = await movementController.annulMovement(request, '1');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.isActive).toBe(false);
      expect(mockMovementService.annulMovement).toHaveBeenCalledWith('1', {
        reason: 'Error de registro',
        userId: 'user-1',
      });
    });

    it('debe retornar 403 sin permisos', async () => {
      const forbiddenResponse = new Response(JSON.stringify({ error: 'Acceso prohibido' }), {
        status: 403,
      });
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/movements/1/annul', {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Error de registro' }),
      });

      const response = await movementController.annulMovement(request, '1');

      expect(response.status).toBe(403);
    });

    it('debe retornar 404 si el movimiento no existe', async () => {
      mockRequireRoles.mockResolvedValue(mockSession);
      mockMovementService.annulMovement.mockRejectedValue(new Error('Movimiento no encontrado'));

      const request = new NextRequest('http://localhost/api/v1/movements/invalid-id/annul', {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Error de registro' }),
      });

      const response = await movementController.annulMovement(request, 'invalid-id');

      expect(response.status).toBe(404);
    });

    it('debe retornar 400 si el movimiento ya está anulado', async () => {
      mockRequireRoles.mockResolvedValue(mockSession);
      mockMovementService.annulMovement.mockRejectedValue(
        new Error('El movimiento ya fue anulado'),
      );

      const request = new NextRequest('http://localhost/api/v1/movements/1/annul', {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Error de registro' }),
      });

      const response = await movementController.annulMovement(request, '1');

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('anulado');
    });
  });

  describe('editDispatch', () => {
    it('debe editar un movimiento y retornar 200', async () => {
      mockRequireRoles.mockResolvedValue(mockSession);
      mockMovementService.editDispatch.mockResolvedValue({
        id: '1',
        quantity: 15,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/movements/1/dispatch', {
        method: 'PUT',
        body: JSON.stringify({ quantity: 15 }),
      });

      const response = await movementController.editDispatch(request, '1');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.quantity).toBe(15);
    });

    it('debe retornar 403 sin permisos', async () => {
      const forbiddenResponse = new Response(JSON.stringify({ error: 'Acceso prohibido' }), {
        status: 403,
      });
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/movements/1/dispatch', {
        method: 'PUT',
        body: JSON.stringify({ quantity: 15 }),
      });

      const response = await movementController.editDispatch(request, '1');

      expect(response.status).toBe(403);
    });

    it('debe retornar 404 si el movimiento no existe', async () => {
      mockRequireRoles.mockResolvedValue(mockSession);
      mockMovementService.editDispatch.mockRejectedValue(new Error('Movimiento no encontrado'));

      const request = new NextRequest('http://localhost/api/v1/movements/invalid/dispatch', {
        method: 'PUT',
        body: JSON.stringify({ quantity: 15 }),
      });

      const response = await movementController.editDispatch(request, 'invalid');

      expect(response.status).toBe(404);
    });
  });
});
