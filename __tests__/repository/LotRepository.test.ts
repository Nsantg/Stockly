import { lotRepository } from '../../src/repository/LotRepository';
import * as db from '../../src/lib/database';

class QueryBuilderMock {
  private result: any;
  constructor(result: any) { this.result = result; }
  leftJoinAndSelect() { return this; }
  where() { return this; }
  andWhere() { return this; }
  orderBy() { return this; }
  getMany() { return Promise.resolve(this.result.many ?? []); }
}

describe('LotRepository', () => {
  const repoMock: any = {
    find: jest.fn(async () => [{ id: 'l1' }]),
    createQueryBuilder: () => new QueryBuilderMock({ many: [{ id: 'l2' }] }),
    create: jest.fn((d) => ({ ...d, id: 'created' })),
    save: jest.fn(async (l) => ({ ...l })),
    softDelete: jest.fn(async () => ({})),
  };

  beforeAll(() => {
    jest.spyOn(db, 'getDataSource').mockImplementation(async () => ({ getRepository: () => repoMock } as any));
  });
  afterAll(() => jest.restoreAllMocks());

  test('findByProductId returns list', async () => {
    const res = await lotRepository.findByProductId('p1');
    expect(Array.isArray(res)).toBe(true);
  });

  test('findExpiringBefore returns lots', async () => {
    const res = await lotRepository.findExpiringBefore(new Date());
    expect(Array.isArray(res)).toBe(true);
  });

  test('create and save and softDelete', async () => {
    const created = await lotRepository.create({ productId: 'p1' } as any);
    expect(created.id).toBe('created');
    const saved = await lotRepository.save(created as any);
    expect(saved).toHaveProperty('id');
    await expect(lotRepository.softDelete('l1')).resolves.toBeUndefined();
  });
});
