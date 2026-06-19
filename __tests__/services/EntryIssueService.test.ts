import { entryIssueService } from '../../src/service/EntryIssueService';
import { entryIssueRepository } from '../../src/repository/EntryIssueRepository';
import { BusinessError } from '../../src/lib/errors';

jest.mock('../../src/repository/EntryIssueRepository', () => ({
  entryIssueRepository: {
    findUnresolved: jest.fn(),
    findById: jest.fn(),
    insert: jest.fn(),
    resolve: jest.fn(),
  },
}));
jest.mock('../../src/lib/realtime/socketServer', () => ({
  initSocketServer: jest.fn(),
  getIO: jest.fn().mockReturnValue(null),
}));

const ISSUE_UUID   = 'aaaaaaaa-0000-4000-8000-000000000020';
const MOV_UUID     = 'aaaaaaaa-0000-4000-8000-000000000021';
const PRODUCT_UUID = 'aaaaaaaa-0000-4000-8000-000000000022';

const MOCK_ISSUE = {
  id: ISSUE_UUID,
  movementId: MOV_UUID,
  productId: PRODUCT_UUID,
  productName: 'Camilla Hidráulica',
  quantity: 3,
  issueType: 'MISSING' as const,
  isResolved: false,
};

beforeEach(() => jest.clearAllMocks());

describe('EntryIssueService (líneas 7-23)', () => {
  describe('getUnresolved', () => {
    it('delega a entryIssueRepository.findUnresolved', async () => {
      (entryIssueRepository.findUnresolved as jest.Mock).mockResolvedValue([MOCK_ISSUE]);

      const result = await entryIssueService.getUnresolved();

      expect(entryIssueRepository.findUnresolved).toHaveBeenCalledTimes(1);
      expect(result).toEqual([MOCK_ISSUE]);
    });
  });

  describe('create', () => {
    it('delega a entryIssueRepository.insert con los datos correctos', async () => {
      (entryIssueRepository.insert as jest.Mock).mockResolvedValue({ ...MOCK_ISSUE, id: ISSUE_UUID });

      const result = await entryIssueService.create({
        movementId: MOV_UUID,
        productId: PRODUCT_UUID,
        productName: 'Camilla Hidráulica',
        quantity: 3,
        issueType: 'MISSING',
      });

      expect(entryIssueRepository.insert).toHaveBeenCalledWith({
        movementId: MOV_UUID,
        productId: PRODUCT_UUID,
        productName: 'Camilla Hidráulica',
        quantity: 3,
        issueType: 'MISSING',
      });
      expect(result.id).toBe(ISSUE_UUID);
    });
  });

  describe('resolve', () => {
    it('resuelve una incidencia pendiente exitosamente', async () => {
      const RESOLVER_MOV = 'aaaaaaaa-0000-4000-8000-000000000099';
      (entryIssueRepository.findById as jest.Mock).mockResolvedValue({ ...MOCK_ISSUE });
      (entryIssueRepository.resolve as jest.Mock).mockResolvedValue(undefined);

      await entryIssueService.resolve(ISSUE_UUID, RESOLVER_MOV);

      expect(entryIssueRepository.resolve).toHaveBeenCalledWith(ISSUE_UUID, RESOLVER_MOV);
    });

    it('incidencia no encontrada → BusinessError', async () => {
      (entryIssueRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        entryIssueService.resolve(ISSUE_UUID, MOV_UUID),
      ).rejects.toThrow(BusinessError);
    });

    it('incidencia ya resuelta → BusinessError', async () => {
      (entryIssueRepository.findById as jest.Mock).mockResolvedValue({
        ...MOCK_ISSUE,
        isResolved: true,
      });

      await expect(
        entryIssueService.resolve(ISSUE_UUID, MOV_UUID),
      ).rejects.toThrow('ya resuelta');
    });
  });
});
