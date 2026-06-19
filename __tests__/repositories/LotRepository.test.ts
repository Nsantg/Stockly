import { lotRepository } from '../../src/repository/LotRepository';
import { getDataSource } from '../../src/lib/database';
import { Lot } from '../../src/entity/Lot';

jest.mock('../../src/lib/database');

const mockQb = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
};

const mockRepo = {
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getDataSource as jest.Mock).mockResolvedValue({ getRepository: jest.fn().mockReturnValue(mockRepo) });
});

describe('LotRepository - líneas 6-41', () => {
  describe('findByProductId()', () => {
    it('línea 9: encuentra lotes por productId ordenados por fecha', async () => {
      const lots = [{ id: 'L-1', productId: 'prod-1', expirationDate: new Date('2026-06-01') }];
      mockRepo.find.mockResolvedValue(lots);

      const result = await lotRepository.findByProductId('prod-1');

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
        order: { expirationDate: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('L-1');
    });
  });

  describe('findExpiringBefore()', () => {
    it('líneas 15-25: busca lotes próximos a vencer con stock > 0', async () => {
      const expiringLots = [{ id: 'L-2', stock: 10 }];
      mockQb.getMany.mockResolvedValue(expiringLots);

      const date = new Date('2026-12-31');
      const result = await lotRepository.findExpiringBefore(date);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('lot');
      expect(mockQb.andWhere).toHaveBeenCalledWith('lot.expirationDate < :date', { date });
      expect(result).toHaveLength(1);
    });
  });

  describe('create()', () => {
    it('línea 27: crea una instancia de Lot', async () => {
      const lotData: Partial<Lot> = { productId: 'prod-1', stock: 50 };
      mockRepo.create.mockReturnValue({ ...lotData, id: 'L-new' });

      const result = await lotRepository.create(lotData);

      expect(mockRepo.create).toHaveBeenCalledWith(lotData);
      expect(result.id).toBe('L-new');
    });
  });

  describe('save()', () => {
    it('línea 31: persiste el lote', async () => {
      const lot = { id: 'L-1', stock: 20 } as Lot;
      mockRepo.save.mockResolvedValue(lot);

      const result = await lotRepository.save(lot);

      expect(mockRepo.save).toHaveBeenCalledWith(lot);
      expect(result.id).toBe('L-1');
    });
  });

  describe('softDelete()', () => {
    it('líneas 35-38: soft-elimina un lote por id', async () => {
      mockRepo.softDelete.mockResolvedValue(undefined);

      await lotRepository.softDelete('L-1');

      expect(mockRepo.softDelete).toHaveBeenCalledWith('L-1');
    });
  });
});
