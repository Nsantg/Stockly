import { NextRequest } from 'next/server';
import { userController } from '../../src/controller/UserController';
import { UserRole } from '../../src/entity/UserRole';
import * as userServiceModule from '../../src/service/UserService';
import * as permissionsModule from '../../src/lib/permissions';

jest.mock('../../src/service/UserService');
jest.mock('../../src/lib/permissions');

describe('UserController', () => {
  let mockUserService: jest.Mocked<typeof userServiceModule.userService>;
  let mockRequireRoles: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserService = userServiceModule.userService as jest.Mocked<typeof userServiceModule.userService>;
    mockRequireRoles = permissionsModule.requireRoles as jest.Mock;
  });

  describe('getUsers', () => {
    it('debe retornar lista de usuarios sin contraseñas', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.getAllUsers.mockResolvedValue([
        { id: '1', email: 'admin@test.com', role: UserRole.ADMIN, password: 'hashed' },
        { id: '2', email: 'user@test.com', role: UserRole.ALMACENISTA, password: 'hashed' },
      ] as any);

      const response = await userController.getUsers();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0]).not.toHaveProperty('password');
      expect(data[0].email).toBe('admin@test.com');
    });

    it('debe retornar 403 si no tiene rol de admin', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const response = await userController.getUsers();

      expect(response.status).toBe(403);
    });

    it('debe manejar error de servicio', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.getAllUsers.mockRejectedValue(
        new Error('Database error')
      );

      const response = await userController.getUsers();

      expect(response.status).toBe(400);
    });
  });

  describe('createUser', () => {
    it('debe crear un usuario y retornar 201 sin contraseña', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.createUser.mockResolvedValue({
        id: '1',
        email: 'newuser@test.com',
        role: UserRole.ALMACENISTA,
        password: 'hashed',
      } as any);

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@test.com',
          password: 'SecurePassword123',
          role: UserRole.ALMACENISTA,
        }),
      });

      const response = await userController.createUser(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.email).toBe('newuser@test.com');
      expect(data).not.toHaveProperty('password');
    });

    it('debe retornar 403 si no es admin', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@test.com',
          password: 'SecurePassword123',
          role: UserRole.ALMACENISTA,
        }),
      });

      const response = await userController.createUser(request);

      expect(response.status).toBe(403);
    });

    it('debe validar email requerido', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.createUser.mockRejectedValue(
        new Error('Datos inválidos')
      );

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({
          password: 'SecurePassword123',
          role: UserRole.ALMACENISTA,
        }),
      });

      const response = await userController.createUser(request);

      expect(response.status).toBe(400);
    });

    it('debe manejar error de email duplicado', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.createUser.mockRejectedValue(
        new Error('El email ya está registrado')
      );

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@test.com',
          password: 'SecurePassword123',
          role: UserRole.ALMACENISTA,
        }),
      });

      const response = await userController.createUser(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('email');
    });
  });

  describe('getById', () => {
    it('debe retornar un usuario por id sin contraseña', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.getUserById.mockResolvedValue({
        id: '1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        password: 'hashed',
      } as any);

      const request = new NextRequest('http://localhost/api/v1/users/1', {
        method: 'GET',
      });

      const response = await userController.getById(request, '1');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.email).toBe('admin@test.com');
      expect(data).not.toHaveProperty('password');
    });

    it('debe retornar 403 si no es admin', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/users/1', {
        method: 'GET',
      });

      const response = await userController.getById(request, '1');

      expect(response.status).toBe(403);
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.getUserById.mockRejectedValue(
        new Error('Usuario no encontrado')
      );

      const request = new NextRequest('http://localhost/api/v1/users/invalid', {
        method: 'GET',
      });

      const response = await userController.getById(request, 'invalid');

      expect(response.status).toBe(404);
    });
  });

  describe('update', () => {
    it('debe actualizar un usuario y retornar 200', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.updateUser.mockResolvedValue({
        id: '1',
        email: 'updated@test.com',
        role: UserRole.ALMACENISTA,
        password: 'hashed',
      } as any);

      const request = new NextRequest('http://localhost/api/v1/users/1', {
        method: 'PUT',
        body: JSON.stringify({ role: UserRole.ALMACENISTA }),
      });

      const response = await userController.update(request, '1');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.role).toBe(UserRole.ALMACENISTA);
      expect(data).not.toHaveProperty('password');
    });

    it('debe retornar 403 si no es admin', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/users/1', {
        method: 'PUT',
        body: JSON.stringify({ role: UserRole.ALMACENISTA }),
      });

      const response = await userController.update(request, '1');

      expect(response.status).toBe(403);
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.updateUser.mockRejectedValue(
        new Error('Usuario no encontrado')
      );

      const request = new NextRequest('http://localhost/api/v1/users/invalid', {
        method: 'PUT',
        body: JSON.stringify({ role: UserRole.ALMACENISTA }),
      });

      const response = await userController.update(request, 'invalid');

      expect(response.status).toBe(404);
    });

    it('debe permitir actualizar parcialmente un usuario', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.updateUser.mockResolvedValue({
        id: '1',
        email: 'user@test.com',
        role: UserRole.DESPACHADOR,
        password: 'hashed',
      } as any);

      const request = new NextRequest('http://localhost/api/v1/users/1', {
        method: 'PUT',
        body: JSON.stringify({ role: UserRole.DESPACHADOR }),
      });

      const response = await userController.update(request, '1');

      expect(response.status).toBe(200);
      expect(mockUserService.updateUser).toHaveBeenCalledWith('1', expect.objectContaining({ role: UserRole.DESPACHADOR }));
    });

    it('debe retornar 400 ante error genérico en update', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.updateUser.mockRejectedValue(new Error('Generic error'));

      const request = new NextRequest('http://localhost/api/v1/users/1', {
        method: 'PUT',
        body: JSON.stringify({ role: UserRole.ALMACENISTA }),
      });

      const response = await userController.update(request, '1');

      expect(response.status).toBe(400);
    });
  });

  describe('deactivate', () => {
    it('debe desactivar un usuario y retornar 200', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.deactivateUser.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/v1/users/1/deactivate', {
        method: 'PATCH',
      });
      const response = await userController.deactivate(request, '1');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Usuario desactivado');
      expect(mockUserService.deactivateUser).toHaveBeenCalledWith('1');
    });

    it('debe retornar 403 si no es admin', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/users/1/deactivate', {
        method: 'PATCH',
      });
      const response = await userController.deactivate(request, '1');

      expect(response.status).toBe(403);
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.deactivateUser.mockRejectedValue(
        new Error('Usuario no encontrado')
      );

      const request = new NextRequest('http://localhost/api/v1/users/invalid/deactivate', {
        method: 'PATCH',
      });
      const response = await userController.deactivate(request, 'invalid');

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('no encontrado');
    });

    it('debe retornar 400 ante error genérico', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.deactivateUser.mockRejectedValue(new Error('Generic error'));

      const request = new NextRequest('http://localhost/api/v1/users/1/deactivate', {
        method: 'PATCH',
      });
      const response = await userController.deactivate(request, '1');

      expect(response.status).toBe(400);
    });

    it('debe retornar 500 ante error desconocido', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.deactivateUser.mockRejectedValue('raw string error');

      const request = new NextRequest('http://localhost/api/v1/users/1/deactivate', {
        method: 'PATCH',
      });
      const response = await userController.deactivate(request, '1');

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Error interno del servidor');
    });
  });

  describe('handleError 500 branch', () => {
    it('debe retornar 500 en getUsers ante tipo de error desconocido', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.getAllUsers.mockRejectedValue('raw string error');

      const response = await userController.getUsers();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Error interno del servidor');
    });

    it('debe retornar 500 en createUser ante tipo de error desconocido', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.createUser.mockRejectedValue('raw string error');

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({ email: 'x@x.com', password: 'Pass123', role: UserRole.ADMIN }),
      });
      const response = await userController.createUser(request);

      expect(response.status).toBe(500);
    });

    it('debe retornar 500 en getById ante tipo de error desconocido', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockUserService.getUserById.mockRejectedValue('raw string error');

      const request = new NextRequest('http://localhost/api/v1/users/1');
      const response = await userController.getById(request, '1');

      expect(response.status).toBe(500);
    });
  });
});
