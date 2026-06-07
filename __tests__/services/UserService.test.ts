import { userService } from '../../src/service/UserService';
import { userRepository } from '../../src/repository/UserRepository';
import { UserRole } from '../../src/entity/UserRole';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';

jest.mock('../../src/repository/UserRepository');
jest.mock('bcryptjs');

describe('UserService - Registro de Usuarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CP-19: Registro correcto con encriptación', () => {
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
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@stockly.com',
          password: 'hashed_password_123',
          rol: UserRole.DESPACHADOR,
        }),
      );
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(result.password).toBe('hashed_password_123');
      expect(result.isActive).toBe(true);
    });

    it('Debe lanzar error si el email ya está en uso sin invocar bcrypt ni save', async () => {
      const validData = {
        nombre: 'Ana',
        apellido: 'López',
        email: 'ana@stockly.com',
        password: 'password123',
      };
      (userRepository.emailExists as jest.Mock).mockResolvedValue(true);

      await expect(userService.createUser(validData)).rejects.toThrow('El email ya está en uso');

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Validación Zod - rechazo antes del repositorio', () => {
    it('Debe fallar si la contraseña es demasiado corta sin tocar el repositorio', async () => {
      const invalidData = {
        nombre: 'Ana',
        apellido: 'López',
        email: 'ana@stockly.com',
        password: '123',
      };

      await expect(userService.createUser(invalidData)).rejects.toThrow(ZodError);

      expect(userRepository.emailExists).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('Debe fallar si el email es inválido sin tocar el repositorio', async () => {
      const invalidData = {
        nombre: 'Ana',
        apellido: 'López',
        email: 'email-invalido',
        password: 'password123',
      };

      await expect(userService.createUser(invalidData)).rejects.toThrow(ZodError);

      expect(userRepository.emailExists).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('Debe fallar si el nombre está vacío sin tocar el repositorio', async () => {
      const invalidData = {
        nombre: '',
        apellido: 'López',
        email: 'ana@stockly.com',
        password: 'password123',
      };

      await expect(userService.createUser(invalidData)).rejects.toThrow(ZodError);

      expect(userRepository.emailExists).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
});
