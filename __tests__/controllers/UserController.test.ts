import { userController } from '../../src/controller/UserController';
import { userService } from '../../src/service/UserService';
import * as permissions from '../../src/lib/permissions';
import { BusinessError } from '../../src/lib/errors';
import { UserRole } from '../../src/entity/UserRole';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

jest.mock('../../src/service/UserService');
jest.mock('../../src/repository/UserRepository');
jest.mock('../../src/lib/permissions');
jest.mock('../../src/lib/auth', () => ({ authOptions: {} }));

function buildRequest(body: unknown): NextRequest {
  return { json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest;
}

function mockAdminSession() {
  (permissions.requireRoles as jest.Mock).mockResolvedValue({
    ok: true,
    session: { user: { id: 'uid-1', rol: UserRole.ADMIN } },
  });
}

function mockForbidden() {
  (permissions.requireRoles as jest.Mock).mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: 'Acceso prohibido' }, { status: 403 }),
  });
}

const ADMIN_USER = {
  id: 'uid-1',
  nombre: 'Ana',
  apellido: 'García',
  email: 'ana@stockly.com',
  password: 'hashed',
  rol: UserRole.ADMIN,
  isActive: true,
};

describe('UserController - líneas 11-33, 47-95', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── handleError (lines 11-22) ───────────────────────────────────────────

  describe('handleError via createUser', () => {
    it('línea 14: retorna 400 con details en ZodError', async () => {
      mockAdminSession();
      (userService.createUser as jest.Mock).mockRejectedValue(
        new ZodError([{ code: 'too_small', minimum: 1, type: 'string', inclusive: true, exact: false, message: 'Requerido', path: ['nombre'] }]),
      );

      const res = await userController.createUser(buildRequest({ nombre: '' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
    });

    it('línea 19: retorna 400 con mensaje en BusinessError', async () => {
      mockAdminSession();
      (userService.createUser as jest.Mock).mockRejectedValue(
        new BusinessError('El email ya está en uso'),
      );

      const res = await userController.createUser(buildRequest({ email: 'dup@x.com' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('El email ya está en uso');
    });

    it('líneas 21-22: retorna 500 en error genérico', async () => {
      mockAdminSession();
      (userService.createUser as jest.Mock).mockRejectedValue(new Error('DB down'));

      const res = await userController.createUser(buildRequest({}));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Error interno del servidor');
    });
  });

  // ─── getUsers (lines 27-33) ──────────────────────────────────────────────

  describe('getUsers()', () => {
    it('línea 29: retorna 403 si no es admin', async () => {
      mockForbidden();
      const res = await userController.getUsers();
      expect(res.status).toBe(403);
    });

    it('líneas 31-33: retorna lista sin password', async () => {
      mockAdminSession();
      (userService.getAllUsers as jest.Mock).mockResolvedValue([ADMIN_USER]);

      const res = await userController.getUsers();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data[0].password).toBeUndefined();
      expect(data[0].nombre).toBe('Ana');
    });

    it('retorna 500 si getAllUsers lanza error', async () => {
      mockAdminSession();
      (userService.getAllUsers as jest.Mock).mockRejectedValue(new Error('Crash'));

      const res = await userController.getUsers();
      expect(res.status).toBe(500);
    });
  });

  // ─── createUser (lines 47-57) ────────────────────────────────────────────

  describe('createUser()', () => {
    it('retorna 403 si no tiene rol', async () => {
      mockForbidden();
      const res = await userController.createUser(buildRequest({}));
      expect(res.status).toBe(403);
    });

    it('líneas 50-55: crea usuario y retorna 201 sin password', async () => {
      mockAdminSession();
      (userService.createUser as jest.Mock).mockResolvedValue(ADMIN_USER);

      const body = { nombre: 'Ana', apellido: 'García', email: 'ana@stockly.com', password: 'pass123' };
      const res = await userController.createUser(buildRequest(body));
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.password).toBeUndefined();
      expect(data.nombre).toBe('Ana');
    });
  });

  // ─── getById (lines 60-71) ───────────────────────────────────────────────

  describe('getById()', () => {
    it('retorna 403 sin rol', async () => {
      mockForbidden();
      const res = await userController.getById(buildRequest(null), 'uid-1');
      expect(res.status).toBe(403);
    });

    it('retorna usuario sin password cuando existe', async () => {
      mockAdminSession();
      (userService.getUserById as jest.Mock).mockResolvedValue(ADMIN_USER);

      const res = await userController.getById(buildRequest(null), 'uid-1');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.password).toBeUndefined();
    });

    it('líneas 67-69: retorna 404 si usuario no encontrado', async () => {
      mockAdminSession();
      (userService.getUserById as jest.Mock).mockRejectedValue(new Error('Usuario no encontrado'));

      const res = await userController.getById(buildRequest(null), 'uid-x');
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('no encontrado');
    });
  });

  // ─── update (lines 73-86) ────────────────────────────────────────────────

  describe('update()', () => {
    it('retorna 403 sin rol', async () => {
      mockForbidden();
      const res = await userController.update(buildRequest({}), 'uid-1');
      expect(res.status).toBe(403);
    });

    it('actualiza usuario y retorna sin password', async () => {
      mockAdminSession();
      (userService.updateUser as jest.Mock).mockResolvedValue({ ...ADMIN_USER, nombre: 'Updated' });

      const res = await userController.update(buildRequest({ nombre: 'Updated' }), 'uid-1');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.password).toBeUndefined();
      expect(data.nombre).toBe('Updated');
    });

    it('retorna 404 si usuario no encontrado al actualizar', async () => {
      mockAdminSession();
      (userService.updateUser as jest.Mock).mockRejectedValue(new Error('Usuario no encontrado'));

      const res = await userController.update(buildRequest({ nombre: 'X' }), 'uid-x');
      expect(res.status).toBe(404);
    });
  });

  // ─── deactivate (lines 88-95) ────────────────────────────────────────────

  describe('deactivate()', () => {
    it('retorna 403 sin rol', async () => {
      mockForbidden();
      const res = await userController.deactivate(buildRequest(null), 'uid-1');
      expect(res.status).toBe(403);
    });

    it('líneas 92-93: desactiva y retorna mensaje', async () => {
      mockAdminSession();
      (userService.deactivateUser as jest.Mock).mockResolvedValue(undefined);

      const res = await userController.deactivate(buildRequest(null), 'uid-1');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBe('Usuario desactivado');
    });

    it('retorna 404 si usuario no encontrado al desactivar', async () => {
      mockAdminSession();
      (userService.deactivateUser as jest.Mock).mockRejectedValue(new Error('Usuario no encontrado'));

      const res = await userController.deactivate(buildRequest(null), 'uid-x');
      expect(res.status).toBe(404);
    });
  });
});
