import { Client as PgClient } from 'pg';
import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Category } from '../../../src/entity/Category';
import { Subcategory } from '../../../src/entity/Subcategory';
import { Product } from '../../../src/entity/Product';
import { Client } from '../../../src/entity/Client';
import { User } from '../../../src/entity/User';
import { UserRole } from '../../../src/entity/UserRole';
import { ClientType } from '../../../src/entity/ClientType';
import {
  TEST_CLIENT_ID,
  TEST_PRODUCT_ID,
  TEST_USER_ID,
} from '../../helpers/movementTestHelpers';

export const FIXTURE_IDS = {
  categoryId: 'cccccccc-1111-2222-3333-444444444444',
  subcategoryId: 'dddddddd-1111-2222-3333-444444444444',
  productId: TEST_PRODUCT_ID,
  clientId: TEST_CLIENT_ID,
  adminUserId: TEST_USER_ID,
  despachadorUserId: '22222222-3333-4444-5555-666666666666',
  almacenistaUserId: '33333333-4444-5555-6666-777777777777',
} as const;

const DEFAULT_STOCK = 50;

export function getTestDbConfig() {
  return {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    user: process.env.DATABASE_USER ?? 'stockly',
    password: process.env.DATABASE_PASSWORD ?? 'stockly_secret_2024',
    database: process.env.DATABASE_NAME ?? 'stockly_test',
  };
}

export async function ensureTestDatabaseExists(): Promise<void> {
  const { host, port, user, password, database } = getTestDbConfig();
  const adminClient = new PgClient({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  await adminClient.connect();
  try {
    const exists = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );
    if (exists.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${database}"`);
    }
  } finally {
    await adminClient.end();
  }
}

export async function runTestMigrations(dataSource: DataSource): Promise<void> {
  const pending = await dataSource.showMigrations();
  if (pending) {
    await dataSource.runMigrations();
  }
}

export async function clearDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    TRUNCATE TABLE
      movements,
      lots,
      products,
      subcategories,
      categories,
      clients,
      users
    RESTART IDENTITY CASCADE
  `);
}

export async function seedTestFixtures(
  dataSource: DataSource,
  options: { productStock?: number } = {},
): Promise<void> {
  const stock = options.productStock ?? DEFAULT_STOCK;
  const passwordHash = await bcrypt.hash('test-password', 10);

  const categoryRepo = dataSource.getRepository(Category);
  const subcategoryRepo = dataSource.getRepository(Subcategory);
  const productRepo = dataSource.getRepository(Product);
  const clientRepo = dataSource.getRepository(Client);
  const userRepo = dataSource.getRepository(User);

  await categoryRepo.save({
    id: FIXTURE_IDS.categoryId,
    name: 'Categoría Integración',
    requiresRefrigeration: false,
    allowsSerialNumber: false,
    isActive: true,
  });

  await subcategoryRepo.save({
    id: FIXTURE_IDS.subcategoryId,
    name: 'Subcategoría Integración',
    categoryId: FIXTURE_IDS.categoryId,
    isActive: true,
  });

  await productRepo.save({
    id: FIXTURE_IDS.productId,
    code: 'INT-PROD-001',
    name: 'Producto Integración',
    subcategoryId: FIXTURE_IDS.subcategoryId,
    stock,
    minStock: 10,
    requiresRefrigeration: false,
    isActive: true,
  });

  await clientRepo.save({
    id: FIXTURE_IDS.clientId,
    name: 'Cliente Integración',
    clientType: ClientType.DETAL,
    isActive: true,
  });

  await userRepo.save([
    {
      id: FIXTURE_IDS.adminUserId,
      nombre: 'Admin',
      apellido: 'Integración',
      email: 'admin.integration@test.com',
      password: passwordHash,
      rol: UserRole.ADMIN,
      isActive: true,
    },
    {
      id: FIXTURE_IDS.despachadorUserId,
      nombre: 'Despachador',
      apellido: 'Integración',
      email: 'despachador.integration@test.com',
      password: passwordHash,
      rol: UserRole.DESPACHADOR,
      isActive: true,
    },
    {
      id: FIXTURE_IDS.almacenistaUserId,
      nombre: 'Almacenista',
      apellido: 'Integración',
      email: 'almacenista.integration@test.com',
      password: passwordHash,
      rol: UserRole.ALMACENISTA,
      isActive: true,
    },
  ]);
}

export async function getProductStock(
  dataSource: DataSource,
  productId: string = FIXTURE_IDS.productId,
): Promise<number> {
  const product = await dataSource.getRepository(Product).findOneBy({ id: productId });
  return product?.stock ?? -1;
}

export async function countMovements(dataSource: DataSource): Promise<number> {
  const result = await dataSource.query('SELECT COUNT(*)::int AS count FROM movements');
  return result[0].count as number;
}
