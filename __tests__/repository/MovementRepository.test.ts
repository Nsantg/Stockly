import { movementRepository } from '../../src/repository/MovementRepository';
import { Movement } from '../../src/entity/Movement';
import { MovementType } from '../../src/entity/MovementType';
import * as db from '../../src/lib/database';

jest.mock('../../src/lib/database');

describe('MovementRepository', () => {
  let mockQueryBuilder: any;
  let mockRepo: any;
  let mockDataSource: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
      getRawOne: jest.fn().mockResolvedValue(null),
    };

    mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (db.getDataSource as jest.Mock).mockResolvedValue(mockDataSource);
  });

  describe('findAll', () => {
    it('debe retornar movimientos paginados sin filtros y con isAnnulled=false por defecto', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(2);
      const mockMovements = [{ id: '1' }, { id: '2' }] as Movement[];
      mockQueryBuilder.getMany.mockResolvedValue(mockMovements);

      const result = await movementRepository.findAll();

      expect(result.data).toEqual(mockMovements);
      expect(result.total).toBe(2);
      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('movement');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.isAnnulled = false');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('debe aplicar todos los filtros posibles en findAll', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      const mockMovements = [{ id: '1' }] as Movement[];
      mockQueryBuilder.getMany.mockResolvedValue(mockMovements);

      const filters = {
        productId: 'prod-123',
        userId: 'user-456',
        type: MovementType.VENTA,
        startDate: new Date('2026-06-01T00:00:00Z'),
        endDate: new Date('2026-06-30T23:59:59Z'),
        isAnnulled: true,
        page: 2,
        limit: 5,
      };

      const result = await movementRepository.findAll(filters);

      expect(result.data).toEqual(mockMovements);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.productId = :productId', { productId: 'prod-123' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.userId = :userId', { userId: 'user-456' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.type = :type', { type: MovementType.VENTA });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.date >= :startDate', { startDate: filters.startDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.date <= :endDate', { endDate: filters.endDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.isAnnulled = :isAnnulled', { isAnnulled: true });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('findById', () => {
    it('debe retornar un movimiento por id', async () => {
      const mockMovement = { id: 'm-1' } as Movement;
      mockQueryBuilder.getOne.mockResolvedValue(mockMovement);

      const result = await movementRepository.findById('m-1');

      expect(result).toEqual(mockMovement);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('movement.id = :id', { id: 'm-1' });
    });
  });

  describe('findByProductId', () => {
    it('debe buscar movimientos por productId ordenados descendentemente', async () => {
      const mockMovements = [{ id: 'm-1' }] as Movement[];
      mockQueryBuilder.getMany.mockResolvedValue(mockMovements);

      const result = await movementRepository.findByProductId('prod-1');

      expect(result).toEqual(mockMovements);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('movement.productId = :productId', { productId: 'prod-1' });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('movement.date', 'DESC');
    });
  });

  describe('findByUserId', () => {
    it('debe buscar movimientos por userId ordenados descendentemente', async () => {
      const mockMovements = [{ id: 'm-1' }] as Movement[];
      mockQueryBuilder.getMany.mockResolvedValue(mockMovements);

      const result = await movementRepository.findByUserId('user-1');

      expect(result).toEqual(mockMovements);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('movement.userId = :userId', { userId: 'user-1' });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('movement.date', 'DESC');
    });
  });

  describe('countByType', () => {
    it('debe retornar el conteo por tipo sin fechas', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const result = await movementRepository.countByType(MovementType.ENTRADA);

      expect(result).toBe(5);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('movement.type = :type', { type: MovementType.ENTRADA });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.isAnnulled = false');
    });

    it('debe retornar el conteo por tipo con fechas', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(3);
      const start = new Date();
      const end = new Date();

      const result = await movementRepository.countByType(MovementType.TRASLADO, start, end);

      expect(result).toBe(3);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.date >= :startDate', { startDate: start });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.date <= :endDate', { endDate: end });
    });
  });

  describe('sumQuantityByProductAndType', () => {
    it('debe sumar la cantidad de movimientos para un producto y tipo', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '15' });

      const result = await movementRepository.sumQuantityByProductAndType('prod-1', MovementType.VENTA);

      expect(result).toBe(15);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('SUM(movement.quantity)', 'total');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('movement.productId = :productId', { productId: 'prod-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.type = :type', { type: MovementType.VENTA });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.isAnnulled = false');
    });

    it('debe retornar 0 si el resultado de getRawOne es null o undefined', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await movementRepository.sumQuantityByProductAndType('prod-1', MovementType.VENTA);

      expect(result).toBe(0);
    });
  });

  describe('findAllForExport', () => {
    it('debe retornar todos los movimientos para exportar con todos los filtros', async () => {
      const mockMovements = [{ id: 'm-1' }] as Movement[];
      mockQueryBuilder.getMany.mockResolvedValue(mockMovements);

      const filters = {
        productId: 'prod-1',
        userId: 'user-1',
        type: MovementType.ENTRADA,
        startDate: new Date('2026-06-01T00:00:00Z'),
        endDate: new Date('2026-06-30T23:59:59Z'),
        isAnnulled: false,
      };

      const result = await movementRepository.findAllForExport(filters);

      expect(result).toEqual(mockMovements);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.productId = :productId', { productId: 'prod-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.userId = :userId', { userId: 'user-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.type = :type', { type: MovementType.ENTRADA });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.date >= :startDate', { startDate: filters.startDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.date <= :endDate', { endDate: filters.endDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('movement.isAnnulled = :isAnnulled', { isAnnulled: false });
    });

    it('debe retornar todos los movimientos para exportar sin filtros', async () => {
      const mockMovements = [{ id: 'm-1' }] as Movement[];
      mockQueryBuilder.getMany.mockResolvedValue(mockMovements);

      const result = await movementRepository.findAllForExport();

      expect(result).toEqual(mockMovements);
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('debe guardar el movimiento', async () => {
      const mockMovement = { id: 'm-1' } as Movement;
      mockRepo.save.mockResolvedValue(mockMovement);

      const result = await movementRepository.save(mockMovement);

      expect(result).toEqual(mockMovement);
      expect(mockRepo.save).toHaveBeenCalledWith(mockMovement);
    });
  });
});
