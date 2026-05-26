import { authOptions } from '../../src/lib/auth';
import { userService } from '../../src/service/UserService';
import { UserRole } from '../../src/entity/User';
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