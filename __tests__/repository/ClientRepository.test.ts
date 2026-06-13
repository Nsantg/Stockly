import * as db from '../../src/lib/database';
import { clientRepository } from '../../src/repository/ClientRepository';

class QB {
  constructor(private res: any) {}
  createQueryBuilder() {
    return this;
  }
  where() {
    return this;
  }
  andWhere() {
    return this;
  }
  getCount() {
    return Promise.resolve(this.res.count || 0);
  }
  getMany() {
    return Promise.resolve(this.res.many || []);
  }
}

describe('ClientRepository', () => {
  const repoMock: any = {
    findOne: jest.fn(async (opts) => ({ id: opts.where?.id || 'c1' })),
    find: jest.fn(async () => [{ id: 'c1' }]),
    createQueryBuilder: () => new QB({ count: 0, many: [{ id: 'c1' }] }),
    create: jest.fn((d) => ({ ...d })),
    save: jest.fn(async (c) => ({ ...c })),
    softDelete: jest.fn(async () => ({})),
  };

  beforeAll(() => {
    jest.spyOn(db, 'getDataSource').mockImplementation(async () => ({ getRepository: () => repoMock } as any));
  });
  afterAll(() => jest.restoreAllMocks());

  test('basic client repo methods', async () => {
    const byId = await clientRepository.findById('c1');
    expect(byId).toHaveProperty('id');

    const active = await clientRepository.findAllActive();
    expect(Array.isArray(active)).toBe(true);

    const created = await clientRepository.create({ name: 'X' } as any);
    expect(created).toHaveProperty('name', 'X');

    const saved = await clientRepository.save(created as any);
    expect(saved).toHaveProperty('name', 'X');

    await expect(clientRepository.softDelete('c1')).resolves.toBeUndefined();
  });
});
