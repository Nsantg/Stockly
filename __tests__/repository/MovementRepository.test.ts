import { movementRepository } from '../../src/repository/MovementRepository';
import * as db from '../../src/lib/database';
import { MovementType } from '../../src/entity/MovementType';

class QueryBuilderMock {
  private result: any;
  constructor(result: any) { this.result = result; }
  leftJoinAndSelect() { return this; }
  where() { return this; }
  andWhere() { return this; }
  select() { return this; }
  orderBy() { return this; }
  skip() { return this; }
  take() { return this; }
  clone() { return this; }
  getCount() { return Promise.resolve(this.result.count ?? 0); }
  getMany() { return Promise.resolve(this.result.many ?? []); }
  getOne() { return Promise.resolve(this.result.one ?? null); }
  getRawOne() { return Promise.resolve(this.result.raw ?? { total: '0' }); }
}

describe('MovementRepository', () => {
  const qbResult = { count: 3, many: [{ id: 'm1' }, { id: 'm2' }], one: { id: 'm1' }, raw: { total: '7' } };
  const repoMock: any = {
    createQueryBuilder: () => new QueryBuilderMock(qbResult),
    save: jest.fn(async (m) => m),
  };

  beforeAll(() => {
    jest.spyOn(db, 'getDataSource').mockImplementation(async () => ({ getRepository: () => repoMock } as any));
  });
  afterAll(() => jest.restoreAllMocks());

  test('findAll returns paginated movements', async () => {
    const res = await movementRepository.findAll({ page: 1, limit: 10 });
    expect(res.total).toBe(3);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('findById and findByProductId and findByUserId', async () => {
    const byId = await movementRepository.findById('m1');
    expect(byId).toEqual({ id: 'm1' });
    const byProduct = await movementRepository.findByProductId('p1');
    expect(Array.isArray(byProduct)).toBe(true);
    const byUser = await movementRepository.findByUserId('u1');
    expect(Array.isArray(byUser)).toBe(true);
  });

  test('countByType and sumQuantityByProductAndType', async () => {
    const c = await movementRepository.countByType(MovementType.ENTRY);
    expect(c).toBe(3);
    const s = await movementRepository.sumQuantityByProductAndType('p1', MovementType.EXIT);
    expect(s).toBe(7);
  });

  test('findAllForExport and save', async () => {
    const list = await movementRepository.findAllForExport({});
    expect(Array.isArray(list)).toBe(true);
    const saved = await movementRepository.save({ id: 'm-new' } as any);
    expect(saved).toEqual({ id: 'm-new' });
  });
});
