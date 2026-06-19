import { entryIssueRepository } from '../../src/repository/EntryIssueRepository';
import { getDataSource } from '../../src/lib/database';

jest.mock('../../src/lib/database');
jest.mock('../../src/lib/realtime/socketServer', () => ({
  initSocketServer: jest.fn(),
  getIO: jest.fn().mockReturnValue(null),
}));

const ISSUE_UUID   = 'aaaaaaaa-0000-4000-8000-000000000010';
const MOV_UUID     = 'aaaaaaaa-0000-4000-8000-000000000011';
const PRODUCT_UUID = 'aaaaaaaa-0000-4000-8000-000000000012';

const MOCK_ISSUE = {
  id: ISSUE_UUID,
  movementId: MOV_UUID,
  productId: PRODUCT_UUID,
  productName: 'Electrodo TENS',
  quantity: 5,
  issueType: 'DAMAGED' as const,
  isResolved: false,
  resolvedByMovementId: null,
  resolvedAt: null,
  createdAt: new Date('2026-06-19T10:00:00Z'),
};

const mockRepo = {
  find:    jest.fn(),
  findOne: jest.fn(),
  create:  jest.fn(),
  save:    jest.fn(),
  update:  jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getDataSource as jest.Mock).mockResolvedValue({
    getRepository: jest.fn().mockReturnValue(mockRepo),
  });
});

describe('EntryIssueRepository (líneas 6-34)', () => {
  describe('findUnresolved', () => {
    it('retorna incidencias no resueltas ordenadas por fecha', async () => {
      mockRepo.find.mockResolvedValue([MOCK_ISSUE]);

      const result = await entryIssueRepository.findUnresolved();

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { isResolved: false },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([MOCK_ISSUE]);
    });

    it('retorna array vacío cuando no hay incidencias pendientes', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await entryIssueRepository.findUnresolved();
      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('retorna la incidencia si existe', async () => {
      mockRepo.findOne.mockResolvedValue(MOCK_ISSUE);

      const result = await entryIssueRepository.findById(ISSUE_UUID);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: ISSUE_UUID } });
      expect(result).toEqual(MOCK_ISSUE);
    });

    it('retorna null si no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await entryIssueRepository.findById('no-existe-uuid-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('insert', () => {
    it('crea y guarda una nueva incidencia', async () => {
      const created = { ...MOCK_ISSUE };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue({ ...created, id: ISSUE_UUID });

      const result = await entryIssueRepository.insert({
        movementId: MOV_UUID,
        productId: PRODUCT_UUID,
        productName: 'Electrodo TENS',
        quantity: 5,
        issueType: 'DAMAGED' as const,
      });

      expect(mockRepo.create).toHaveBeenCalledWith({
        movementId: MOV_UUID,
        productId: PRODUCT_UUID,
        productName: 'Electrodo TENS',
        quantity: 5,
        issueType: 'DAMAGED',
        isResolved: false,
        resolvedByMovementId: null,
        resolvedAt: null,
      });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.id).toBe(ISSUE_UUID);
    });
  });

  describe('resolve', () => {
    it('marca la incidencia como resuelta', async () => {
      const RESOLVER_MOV_UUID = 'aaaaaaaa-0000-4000-8000-000000000099';
      mockRepo.update.mockResolvedValue({ affected: 1 });

      await entryIssueRepository.resolve(ISSUE_UUID, RESOLVER_MOV_UUID);

      expect(mockRepo.update).toHaveBeenCalledWith(
        ISSUE_UUID,
        expect.objectContaining({
          isResolved: true,
          resolvedByMovementId: RESOLVER_MOV_UUID,
          resolvedAt: expect.any(Date),
        }),
      );
    });
  });
});
