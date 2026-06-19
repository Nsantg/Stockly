/**
 * Pruebas de Seguridad - Control de Acceso y Autorización por Roles
 *
 * Verifica que los endpoints sensibles rechacen peticiones sin token,
 * o de roles no autorizados (Visualizador), con HTTP 401/403.
 *
 * Ejecutar: npm run test -- --testPathPattern="security/apiSecurity"
 */

import { NextResponse } from 'next/server';
import * as permissions from '../../src/lib/permissions';
import { userController } from '../../src/controller/UserController';
import { UserRole } from '../../src/entity/UserRole';
import { NextRequest } from 'next/server';

jest.mock('../../src/lib/permissions');
jest.mock('../../src/service/UserService');
jest.mock('../../src/repository/UserRepository');
jest.mock('../../src/lib/auth', () => ({ authOptions: {} }));

function buildRequest(body: unknown = {}): NextRequest {
  return { json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest;
}

function mockUnauthorized() {
  (permissions.requireRoles as jest.Mock).mockResolvedValue({
    ok: false,
    response: NextResponse.json(
      { error: 'No autorizado', details: 'Se requiere una sesión activa' },
      { status: 401 },
    ),
  });
}

function mockForbiddenRole(role: UserRole) {
  (permissions.requireRoles as jest.Mock).mockResolvedValue({
    ok: false,
    response: NextResponse.json(
      {
        error: 'Acceso prohibido',
        details: `Esta operación requiere uno de los siguientes roles: Admin`,
      },
      { status: 403 },
    ),
  });
}

describe('Seguridad API - Control de acceso por roles (RN-01)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── SEC-001: Sin autenticación → 401 ────────────────────────────────────

  describe('SEC-001: Peticiones sin token/sesión → HTTP 401', () => {
    it('getUsers sin sesión retorna 401', async () => {
      mockUnauthorized();
      const res = await userController.getUsers();
      expect(res.status).toBe(401);
    });

    it('createUser sin sesión retorna 401', async () => {
      mockUnauthorized();
      const res = await userController.createUser(buildRequest({ nombre: 'Test' }));
      expect(res.status).toBe(401);
    });

    it('getById sin sesión retorna 401', async () => {
      mockUnauthorized();
      const res = await userController.getById(buildRequest(null), 'uid-1');
      expect(res.status).toBe(401);
    });

    it('update sin sesión retorna 401', async () => {
      mockUnauthorized();
      const res = await userController.update(buildRequest({}), 'uid-1');
      expect(res.status).toBe(401);
    });

    it('deactivate sin sesión retorna 401', async () => {
      mockUnauthorized();
      const res = await userController.deactivate(buildRequest(null), 'uid-1');
      expect(res.status).toBe(401);
    });
  });

  // ─── SEC-002: Rol Visualizador → 403 ─────────────────────────────────────

  describe('SEC-002: Rol Visualizador en endpoints de escritura → HTTP 403', () => {
    beforeEach(() => {
      mockForbiddenRole(UserRole.VISUALIZADOR);
    });

    it('createUser con rol Visualizador retorna 403', async () => {
      const res = await userController.createUser(
        buildRequest({ nombre: 'Hack', email: 'hack@x.com', password: 'pass123' }),
      );
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toBe('Acceso prohibido');
    });

    it('deactivate con rol Visualizador retorna 403', async () => {
      const res = await userController.deactivate(buildRequest(null), 'uid-target');
      expect(res.status).toBe(403);
    });

    it('update con rol Visualizador retorna 403', async () => {
      const res = await userController.update(buildRequest({ nombre: 'Intento' }), 'uid-1');
      expect(res.status).toBe(403);
    });
  });

  // ─── SEC-003: Rol Despachador → 403 en rutas solo-Admin ─────────────────

  describe('SEC-003: Rol Despachador en rutas de administración → HTTP 403', () => {
    beforeEach(() => {
      mockForbiddenRole(UserRole.DESPACHADOR);
    });

    it('getUsers con rol Despachador retorna 403', async () => {
      const res = await userController.getUsers();
      expect(res.status).toBe(403);
    });

    it('createUser con rol Despachador retorna 403', async () => {
      const res = await userController.createUser(
        buildRequest({ nombre: 'Test', email: 'test@x.com', password: 'pass123' }),
      );
      expect(res.status).toBe(403);
    });
  });

  // ─── SEC-004: Detalles de error no expone información sensible ───────────

  describe('SEC-004: Respuesta de error no expone datos internos', () => {
    it('el body de 403 no incluye stack trace ni detalles de implementación', async () => {
      mockForbiddenRole(UserRole.VISUALIZADOR);

      const res = await userController.createUser(buildRequest({}));
      const data = await res.json();

      expect(data).not.toHaveProperty('stack');
      expect(data).not.toHaveProperty('sql');
      expect(data.error).toBe('Acceso prohibido');
    });

    it('el body de 401 incluye descripción clara sin detallar la arquitectura', async () => {
      mockUnauthorized();

      const res = await userController.getUsers();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('No autorizado');
      expect(data).not.toHaveProperty('stack');
    });
  });
});
