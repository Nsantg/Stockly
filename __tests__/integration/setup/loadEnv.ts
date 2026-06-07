import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

Object.assign(process.env, { NODE_ENV: 'test' });
process.env.DATABASE_NAME = process.env.DATABASE_NAME ?? 'stockly_test';
