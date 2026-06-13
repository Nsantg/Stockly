import { userRepository } from '../../src/repository/UserRepository';
import * as db from '../../src/lib/database';

class QB {
  private res: any;
  constructor(res: any) { this.res = res; }
  createQueryBuilder() { return this; }
  where() { return this; }
  andWhere() { return this; }
  getCount() { return Promise.resolve(this.res.count ?? 0); }
  findOne(opts?: any) { return Promise.resolve(this.res.one ?? null); }
}

describe('UserRepository', () => {
  const repoMock: any = {
    findOne: jest.fn(async (opts) => ({ id: 'u1', email: opts.where?.email ?? opts.where?.id })),
    find: jest.fn(async () => [{ id: 'u1' }]),
    createQueryBuilder: () => new QB({ count: 1 }),
    create: jest.fn((d) => ({ ...d })),
    save: jest.fn(async (u) => ({ ...u })),
    update: jest.fn(async () => ({})),
  };

  beforeAll(() => {
    jest.spyOn(db, 'getDataSource').mockImplementation(async () => ({ getRepository: () => repoMock } as any));
  });
  afterAll(() => jest.restoreAllMocks());

  test('findByEmail and findById work', async () => {
    const byEmail = await userRepository.findByEmail('a@b.com');
    expect(byEmail).toHaveProperty('email');
    const byId = await userRepository.findById('u1');
    expect(byId).toHaveProperty('id');
  });

  test('findAll and findAllActive', async () => {
    const all = await userRepository.findAll();
    expect(Array.isArray(all)).toBe(true);
    const active = await userRepository.findAllActive();
    expect(Array.isArray(active)).toBe(true);
  });

  test('emailExists uses query builder', async () => {
    const exists = await userRepository.emailExists('a@b.com');
    expect(typeof exists).toBe('boolean');
  });

  test('create save update deactivate', async () => {
    const created = await userRepository.create({ nombre: 'A' } as any);
    expect(created).toHaveProperty('nombre');
    const saved = await userRepository.save({ id: 'u1' } as any);
    expect(saved).toHaveProperty('id');
    await expect(userRepository.update('u1', { nombre: 'X' })).resolves.toBeUndefined();
    await expect(userRepository.deactivate('u1')).resolves.toBeUndefined();
  });
});
