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

  // ─── Métodos CRUD adicionales (líneas 47-79) ─────────────────────────────

  describe('getUserByEmail()', () => {
    it('línea 47: delega en userRepository.findByEmail', async () => {
      const mockUser = { id: 'uid-1', email: 'juan@stockly.com' };
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('juan@stockly.com');

      expect(userRepository.findByEmail).toHaveBeenCalledWith('juan@stockly.com');
      expect(result?.email).toBe('juan@stockly.com');
    });

    it('retorna null si el email no existe', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      const result = await userService.getUserByEmail('no@existe.com');
      expect(result).toBeNull();
    });
  });

  describe('listUsers()', () => {
    it('línea 51: delega en findAllActive', async () => {
      const activeUsers = [{ id: 'uid-1', isActive: true }];
      (userRepository.findAllActive as jest.Mock).mockResolvedValue(activeUsers);

      const result = await userService.listUsers();

      expect(userRepository.findAllActive).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getAllUsers()', () => {
    it('línea 55: delega en findAll', async () => {
      const allUsers = [{ id: 'uid-1' }, { id: 'uid-2' }];
      (userRepository.findAll as jest.Mock).mockResolvedValue(allUsers);

      const result = await userService.getAllUsers();

      expect(userRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('getUserById()', () => {
    it('líneas 59-62: retorna el usuario si existe', async () => {
      const mockUser = { id: 'uid-1', nombre: 'Juan' };
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getUserById('uid-1');

      expect(userRepository.findById).toHaveBeenCalledWith('uid-1');
      expect(result.id).toBe('uid-1');
    });

    it('línea 61: lanza BusinessError si no existe', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserById('no-existe')).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('updateUser()', () => {
    const existingUser = { id: 'uid-1', nombre: 'Juan', email: 'juan@stockly.com', isActive: true };

    it('líneas 64-70: actualiza campos y persiste', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue({ ...existingUser });
      (userRepository.emailExists as jest.Mock).mockResolvedValue(false);
      (userRepository.save as jest.Mock).mockResolvedValue({ ...existingUser, nombre: 'Nuevo' });

      const result = await userService.updateUser('uid-1', { nombre: 'Nuevo' });

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(result.nombre).toBe('Nuevo');
    });

    it('lanza BusinessError si el nuevo email ya está en uso por otro usuario', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue({ ...existingUser });
      (userRepository.emailExists as jest.Mock).mockResolvedValue(true);

      await expect(
        userService.updateUser('uid-1', { email: 'otro@stockly.com' }),
      ).rejects.toThrow('El email ya está en uso');
    });

    it('lanza BusinessError si el usuario a actualizar no existe', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(userService.updateUser('no-existe', { nombre: 'X' })).rejects.toThrow(
        'Usuario no encontrado',
      );
    });
  });

  describe('deactivateUser()', () => {
    it('líneas 72-75: desactiva el usuario si existe', async () => {
      const mockUser = { id: 'uid-1', isActive: true };
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.deactivate as jest.Mock).mockResolvedValue(undefined);

      await userService.deactivateUser('uid-1');

      expect(userRepository.deactivate).toHaveBeenCalledWith('uid-1');
    });

    it('lanza BusinessError si el usuario no existe al desactivar', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(userService.deactivateUser('no-existe')).rejects.toThrow('Usuario no encontrado');
      expect(userRepository.deactivate).not.toHaveBeenCalled();
    });
  });
});
