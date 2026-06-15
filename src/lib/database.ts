import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entity/User';
import { Category } from '../entity/Category';
import { Subcategory } from '../entity/Subcategory';
import { Product } from '../entity/Product';
import { Lot } from '../entity/Lot';
import { Client } from '../entity/Client';
import { Movement } from '../entity/Movement';
import { EntryIssue } from '../entity/EntryIssue';

const isCliMode = process.env.TYPEORM_CLI === 'true';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'stockly_db',
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  entities: isCliMode
    ? ['src/entity/*.ts']
    : [User, Category, Subcategory, Product, Lot, Client, Movement, EntryIssue],
  migrations: isCliMode ? ['src/migrations/*.ts'] : [],
});

let initPromise: Promise<DataSource> | null = null;

export function getDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) return Promise.resolve(AppDataSource);
  if (initPromise) return initPromise;

  initPromise = AppDataSource.initialize()
    .then(() => AppDataSource)
    .catch((err) => {
      initPromise = null;
      throw err;
    });

  return initPromise;
}
