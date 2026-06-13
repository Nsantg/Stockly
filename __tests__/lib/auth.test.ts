import { authOptions } from '../../src/lib/auth';
import { userService } from '../../src/service/UserService';
import { UserRole } from '../../src/entity/UserRole';
import bcrypt from 'bcryptjs';

jest.mock('../../src/service/UserService');
jest.mock('bcryptjs');

describe('Autenticación NextAuth - Authorize', () => {
  let authorizeFunction: any;

  beforeAll(() => {
    const credentialsProvider = authOptions.providers[0] as any;
    authorizeFunction = credentialsProvider.options.authorize;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe retornar el usuario si las credenciales son correctas y está activo', async () => {
    const mockUser = {
      id: 'uuid-1',
      email: 'admin@stockly.com',
      nombre: 'Admin',
      apellido: 'Stockly',
      password: 'hashed_password',
      rol: UserRole.ADMIN,
      isActive: true,
    };

    (userService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await authorizeFunction({ email: 'admin@stockly.com', password: 'password123' });

    expect(result).not.toBeNull();
    expect(result.email).toBe('admin@stockly.com');
    expect(result.rol).toBe(UserRole.ADMIN);
  });

  it('Debe retornar null si las credenciales son incompletas', async () => {
    expect(await authorizeFunction(null)).toBeNull();
    expect(await authorizeFunction({ email: '' })).toBeNull();
    expect(await authorizeFunction({ password: '' })).toBeNull();
  });

  it('Debe retornar null si el usuario no existe', async () => {
    (userService.getUserByEmail as jest.Mock).mockResolvedValue(null);

    const result = await authorizeFunction({ email: 'nonexistent@test.com', password: 'password123' });

    expect(result).toBeNull();
  });

  it('Debe retornar null si la contraseña es incorrecta', async () => {
    const mockUser = { email: 'user@stockly.com', password: 'hashed_password', isActive: true };
    
    (userService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false); 

    const result = await authorizeFunction({ email: 'user@stockly.com', password: 'wrong_password' });

    expect(result).toBeNull();
  });

  it('Debe retornar null si el usuario no está activo (Soft Delete o Suspendido)', async () => {
    const mockUser = { email: 'user@stockly.com', password: 'hashed_password', isActive: false };
    
    (userService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

    const result = await authorizeFunction({ email: 'user@stockly.com', password: 'password123' });

    expect(result).toBeNull();
    expect(bcrypt.compare).not.toHaveBeenCalled(); 
  });
});

describe('Autenticación NextAuth - Callbacks', () => {
  it('jwt callback debe adjuntar la info de usuario al token si user existe', async () => {
    const jwtCallback = authOptions.callbacks?.jwt as any;
    const mockUser = {
      id: 'uuid-123',
      nombre: 'John',
      apellido: 'Doe',
      rol: UserRole.VENDEDOR,
    };

    const token = await jwtCallback({ token: {}, user: mockUser });

    expect(token).toEqual({
      id: 'uuid-123',
      nombre: 'John',
      apellido: 'Doe',
      rol: UserRole.VENDEDOR,
    });
  });

  it('jwt callback debe retornar el token sin cambios si user no existe', async () => {
    const jwtCallback = authOptions.callbacks?.jwt as any;
    const initialToken = { existing: 'value' };

    const token = await jwtCallback({ token: initialToken, user: null });

    expect(token).toEqual(initialToken);
  });

  it('session callback debe inyectar datos del token en la session', async () => {
    const sessionCallback = authOptions.callbacks?.session as any;
    const mockSession = { user: {} };
    const mockToken = {
      id: 'uuid-123',
      nombre: 'John',
      apellido: 'Doe',
      rol: UserRole.VENDEDOR,
    };

    const session = await sessionCallback({ session: mockSession, token: mockToken });

    expect(session.user).toEqual({
      id: 'uuid-123',
      nombre: 'John',
      apellido: 'Doe',
      rol: UserRole.VENDEDOR,
    });
  });
});