import { NextRequest } from 'next/server';
import { userController } from '../../src/controller/UserController';
import { userService } from '../../src/service/UserService';
import { getServerSession } from 'next-auth';
import { UserRole } from '../../src/entity/UserRole';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('../../src/service/UserService');

const validAdminPayload = {
  nombre: 'Xio',
  apellido: 'Ocampo',
  email: 'test@test.com',
  password: '123456',
  rol: UserRole.ADMIN,
};

function buildCreateUserRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('UserController - Restricción de Roles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userService.createUser as jest.Mock).mockResolvedValue({
      id: '1',
      nombre: 'Mock',
      apellido: 'User',
      email: 'mock@test.com',
      rol: UserRole.ADMIN,
      password: 'hash',
    });
  });

  it('Debe denegar la creación de un rol ADMIN si el usuario actual NO está logueado', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await userController.createUser(
      buildCreateUserRequest(validAdminPayload),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('No autorizado');
    expect(body.details).toContain('sesión activa');
    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it('Debe denegar la creación de un rol ADMIN si el usuario actual NO es ADMIN', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { rol: UserRole.DESPACHADOR },
    });

    const response = await userController.createUser(
      buildCreateUserRequest(validAdminPayload),
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Acceso prohibido');
    expect(body.details).toContain(UserRole.ADMIN);
    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it('Debe permitir la creación si un ADMIN crea a otro ADMIN', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { rol: UserRole.ADMIN },
    });

    const mockCreatedUser = {
      id: '1',
      nombre: 'Nuevo',
      apellido: 'Admin',
      email: 'nuevo@admin.com',
      rol: UserRole.ADMIN,
      password: 'hash',
    };
    (userService.createUser as jest.Mock).mockResolvedValue(mockCreatedUser);

    const response = await userController.createUser(
      buildCreateUserRequest({
        nombre: 'Nuevo',
        apellido: 'Admin',
        email: 'nuevo@admin.com',
        password: '123456',
        rol: UserRole.ADMIN,
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.password).toBeUndefined();
    expect(userService.createUser).toHaveBeenCalledTimes(1);
  });
});
