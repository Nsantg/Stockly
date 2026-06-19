import { userRepository } from '../../src/repository/UserRepository';
import { getDataSource } from '../../src/lib/database';
import { User } from '../../src/entity/User';
import { UserRole } from '../../src/entity/UserRole';

jest.mock('../../src/lib/database');

const mockQb = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getCount: jest.fn(),
};

const mockRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getDataSource as jest.Mock).mockResolvedValue({ getRepository: jest.fn().mockReturnValue(mockRepo) });
});

const MOCK_USER: User = {
  id: 'uid-1',
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@stockly.com',
  password: 'hashed',
  rol: UserRole.ADMIN,
  isActive: true,
  createdAt: new Date(),
} as User;

describe('UserRepository - líneas 6-47', () => {
  describe('findByEmail()', () => {
    it('línea 10: encuentra usuario por email', async () => {
      mockRepo.findOne.mockResolvedValue(MOCK_USER);

      const result = await userRepository.findByEmail('juan@stockly.com');

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: 'juan@stockly.com' } });
      expect(result?.email).toBe('juan@stockly.com');
    });

    it('retorna null si no existe el email', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await userRepository.findByEmail('noexiste@x.com');
      expect(result).toBeNull();
    });
  });

  describe('findById()', () => {
    it('línea 14: encuentra usuario por id', async () => {
      mockRepo.findOne.mockResolvedValue(MOCK_USER);

      const result = await userRepository.findById('uid-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'uid-1' } });
      expect(result?.id).toBe('uid-1');
    });
  });

  describe('findAll()', () => {
    it('línea 18: retorna todos los usuarios ordenados por createdAt', async () => {
      mockRepo.find.mockResolvedValue([MOCK_USER]);

      const result = await userRepository.findAll();

      expect(mockRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'ASC' } });
      expect(result).toHaveLength(1);
    });
  });

  describe('findAllActive()', () => {
    it('línea 22: retorna solo usuarios activos', async () => {
      mockRepo.find.mockResolvedValue([MOCK_USER]);

      const result = await userRepository.findAllActive();

      expect(mockRepo.find).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(result).toHaveLength(1);
    });
  });

  describe('emailExists()', () => {
    it('líneas 26-32: retorna true si el email ya existe', async () => {
      mockQb.getCount.mockResolvedValue(1);

      const exists = await userRepository.emailExists('juan@stockly.com');

      expect(exists).toBe(true);
      expect(mockQb.where).toHaveBeenCalledWith('u.email = :email', { email: 'juan@stockly.com' });
    });

    it('retorna false si el email no existe', async () => {
      mockQb.getCount.mockResolvedValue(0);
      const exists = await userRepository.emailExists('nuevo@x.com');
      expect(exists).toBe(false);
    });

    it('con excludeId: agrega cláusula andWhere', async () => {
      mockQb.getCount.mockResolvedValue(0);

      await userRepository.emailExists('juan@stockly.com', 'uid-1');

      expect(mockQb.andWhere).toHaveBeenCalledWith('u.id != :excludeId', { excludeId: 'uid-1' });
    });
  });

  describe('create()', () => {
    it('línea 34: crea instancia de usuario sin persistir', async () => {
      mockRepo.create.mockReturnValue(MOCK_USER);

      const result = await userRepository.create({ nombre: 'Juan', email: 'juan@stockly.com' });

      expect(mockRepo.create).toHaveBeenCalled();
      expect(result.nombre).toBe('Juan');
    });
  });

  describe('save()', () => {
    it('línea 38: persiste el usuario', async () => {
      mockRepo.save.mockResolvedValue(MOCK_USER);

      const result = await userRepository.save(MOCK_USER);

      expect(mockRepo.save).toHaveBeenCalledWith(MOCK_USER);
      expect(result.id).toBe('uid-1');
    });
  });

  describe('update()', () => {
    it('línea 42: actualiza campos del usuario', async () => {
      mockRepo.update.mockResolvedValue(undefined);

      await userRepository.update('uid-1', { nombre: 'Nuevo Nombre' });

      expect(mockRepo.update).toHaveBeenCalledWith('uid-1', { nombre: 'Nuevo Nombre' });
    });
  });

  describe('deactivate()', () => {
    it('línea 46: pone isActive en false', async () => {
      mockRepo.update.mockResolvedValue(undefined);

      await userRepository.deactivate('uid-1');

      expect(mockRepo.update).toHaveBeenCalledWith('uid-1', { isActive: false });
    });
  });
});
