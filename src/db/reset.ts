import 'reflect-metadata';
import { AppDataSource } from '../lib/database';

const TABLES = ['movements', 'entry_issues', 'lots', 'products', 'subcategories', 'categories', 'clients', 'users'];

async function reset(): Promise<void> {
  if (process.env.CONFIRM_RESET !== 'YES') {
    console.error(
      'Operación cancelada: este script borra TODOS los datos (productos, categorías, clientes, usuarios, movimientos).\n' +
        'Para confirmar, ejecútalo con la variable de entorno CONFIRM_RESET=YES.',
    );
    process.exit(1);
  }

  await AppDataSource.initialize();
  console.log(`Host: ${process.env.DATABASE_HOST} | Base de datos: ${process.env.DATABASE_NAME}`);
  console.log(`Vaciando tablas: ${TABLES.join(', ')}...`);

  await AppDataSource.query(`TRUNCATE TABLE ${TABLES.join(', ')} CASCADE`);

  console.log('Base de datos vaciada. Ejecuta "npm run seed" para volver a poblarla.');
  await AppDataSource.destroy();
}

reset().catch((err) => {
  console.error('Error ejecutando reset:', err);
  process.exit(1);
});
