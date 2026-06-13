import * as db from '../../src/lib/database';
import { clientRepository } from '../../src/repository/ClientRepository';
import { Client } from '../../src/entity/Client';

jest.mock('../../src/lib/database');

describe('ClientRepository', () => {
  let mockQueryBuilder: any;
  let mockRepo: any;
  let mockDataSource: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
    };

    mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((data) => data),
      softDelete: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (db.getDataSource as jest.Mock).mockResolvedValue(mockDataSource);
  });

  it('findAllActive debe retornar clientes activos', async () => {
    const mockClients = [{ id: '1', name: 'Client 1', isActive: true } as Client];
    mockRepo.find.mockResolvedValue(mockClients);

    const result = await clientRepository.findAllActive();

    expect(result).toEqual(mockClients);
    expect(mockRepo.find).toHaveBeenCalledWith({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  });

  it('findById debe buscar un cliente activo por id', async () => {
    const mockClient = { id: '1', name: 'Client 1', isActive: true } as Client;
    mockRepo.findOne.mockResolvedValue(mockClient);

    const result = await clientRepository.findById('1');

    expect(result).toEqual(mockClient);
    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: '1', isActive: true },
    });
  });

  it('findByName debe buscar clientes por nombre usando QueryBuilder', async () => {
    const mockClients = [{ id: '1', name: 'Client 1', clientType: 'DETAL' }];
    mockQueryBuilder.getMany.mockResolvedValue(mockClients);

    const result = await clientRepository.findByName('test');

    expect(result).toEqual(mockClients);
    expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('client');
    expect(mockQueryBuilder.select).toHaveBeenCalledWith(['client.id', 'client.name', 'client.clientType']);
    expect(mockQueryBuilder.where).toHaveBeenCalledWith('client.isActive = :isActive', { isActive: true });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('client.deletedAt IS NULL');
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('LOWER(client.name) LIKE LOWER(:name)', { name: '%test%' });
    expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('client.name', 'ASC');
    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
  });

  describe('existsByEmail', () => {
    it('debe retornar true si el email ya existe', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await clientRepository.existsByEmail('test@test.com');

      expect(result).toBe(true);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('client.email = :email', { email: 'test@test.com' });
    });

    it('debe excluir el id indicado', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await clientRepository.existsByEmail('test@test.com', 'exclude-id');

      expect(result).toBe(false);
      expect(mockQueryBuilder.andWhere).toHaveBeenLastCalledWith('client.id != :excludeId', { excludeId: 'exclude-id' });
    });
  });

  it('create debe retornar una instancia de Client', async () => {
    const data = { name: 'X' };
    const result = await clientRepository.create(data);

    expect(result).toEqual(data);
    expect(mockRepo.create).toHaveBeenCalledWith(data);
  });

  it('save debe guardar el cliente', async () => {
    const client = { id: '1', name: 'X' } as Client;
    mockRepo.save.mockResolvedValue(client);

    const result = await clientRepository.save(client);

    expect(result).toEqual(client);
    expect(mockRepo.save).toHaveBeenCalledWith(client);
  });

  it('softDelete debe llamar al metodo de soft delete', async () => {
    await clientRepository.softDelete('1');
    expect(mockRepo.softDelete).toHaveBeenCalledWith('1');
  });
});
