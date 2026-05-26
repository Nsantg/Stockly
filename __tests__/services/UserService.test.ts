import { userService } from '../../src/service/UserService';
import { userRepository } from '../../src/repository/UserRepository';
import { UserRole } from '../../src/entity/User';
import bcrypt from 'bcryptjs';

jest.mock('../../src/repository/UserRepository');
jest.mock('bcryptjs');

describe('UserService - Registro de Usuarios', () => {
  beforeEach(() => {
    jest.clearAllMocks(); 
  });

  it('Debe crear un usuario exitosamente encriptando su contraseña', async () => {
    const validData = {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@stockly.com',
      password: 'password123',
      rol: UserRole.DESPACHADOR,
    };

    (userRepository.emailExists as jest.Mock).mockResolvedValue(false);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password_123');
    (userRepository.create as jest.Mock).mockImplementation((data) => data);
    (userRepository.save as jest.Mock).mockImplementation(async (data) => ({
      id: 'uuid-1234',
      ...data,
      isActive: true,
    }));

    const result = await userService.createUser(validData);

    
    expect(userRepository.emailExists).toHaveBeenCalledWith('juan@stockly.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(userRepository.save).toHaveBeenCalled();
    expect(result.password).toBe('hashed_password_123'); 
  });

  it('Debe lanzar un error si el email ya está en uso', async () => {
    
    const validData = {
      nombre: 'Ana',
      apellido: 'López',
      email: 'ana@stockly.com',
      password: 'password123',
    };
    (userRepository.emailExists as jest.Mock).mockResolvedValue(true); 

    await expect(userService.createUser(validData)).rejects.toThrow('El email ya está en uso');
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('Debe fallar si los datos no cumplen la validación (Zod)', async () => {
    const invalidData = {
      nombre: '',
      apellido: 'López',
      email: 'email-invalido', 
      password: '123', 
    };

    await expect(userService.createUser(invalidData as any)).rejects.toThrow();
  });
});