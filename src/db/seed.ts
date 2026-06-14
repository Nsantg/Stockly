import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../lib/database';
import { Category } from '../entity/Category';
import { Subcategory } from '../entity/Subcategory';
import { Product } from '../entity/Product';
import { Client } from '../entity/Client';
import { User } from '../entity/User';
import { Movement } from '../entity/Movement';
import { UserRole } from '../entity/UserRole';
import { ClientType } from '../entity/ClientType';
import { MovementType } from '../entity/MovementType';
import { LocationType } from '../entity/LocationType';

function daysAgo(n: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  const categoryRepo = AppDataSource.getRepository(Category);
  const subcategoryRepo = AppDataSource.getRepository(Subcategory);
  const productRepo = AppDataSource.getRepository(Product);
  const clientRepo = AppDataSource.getRepository(Client);
  const userRepo = AppDataSource.getRepository(User);
  const movementRepo = AppDataSource.getRepository(Movement);

  if ((await categoryRepo.count()) > 0) {
    console.log('La base de datos ya contiene categorías. Seed omitido para evitar duplicados.');
    await AppDataSource.destroy();
    return;
  }

  const categories = await categoryRepo.save(
    categoryRepo.create([
      { name: 'Electroterapia', allowsSerialNumber: true, requiresRefrigeration: false },
      { name: 'Termoterapia', allowsSerialNumber: false, requiresRefrigeration: false },
      { name: 'Hidroterapia', allowsSerialNumber: false, requiresRefrigeration: false },
      { name: 'Farmacéuticos', allowsSerialNumber: false, requiresRefrigeration: true },
      { name: 'Ortopedia', allowsSerialNumber: false, requiresRefrigeration: false },
      { name: 'Consumibles', allowsSerialNumber: false, requiresRefrigeration: false },
    ]),
  );

  const cat = new Map(categories.map((c) => [c.name, c]));

  const subcategories = await subcategoryRepo.save(
    subcategoryRepo.create([
      { name: 'TENS', categoryId: cat.get('Electroterapia')!.id },
      { name: 'Ultrasonido', categoryId: cat.get('Electroterapia')!.id },
      { name: 'Láser terapéutico', categoryId: cat.get('Electroterapia')!.id },
      { name: 'Magnetoterapia', categoryId: cat.get('Electroterapia')!.id },
      { name: 'Compresa húmeda', categoryId: cat.get('Termoterapia')!.id },
      { name: 'Parafina', categoryId: cat.get('Termoterapia')!.id },
      { name: 'Infrarrojos', categoryId: cat.get('Termoterapia')!.id },
      { name: 'Turbinas', categoryId: cat.get('Hidroterapia')!.id },
      { name: 'Tanques', categoryId: cat.get('Hidroterapia')!.id },
      { name: 'Accesorios', categoryId: cat.get('Hidroterapia')!.id },
      { name: 'Analgésicos', categoryId: cat.get('Farmacéuticos')!.id },
      { name: 'Antiinflamatorios', categoryId: cat.get('Farmacéuticos')!.id },
      { name: 'Geles conductores', categoryId: cat.get('Farmacéuticos')!.id },
      { name: 'Férulas', categoryId: cat.get('Ortopedia')!.id },
      { name: 'Vendajes', categoryId: cat.get('Ortopedia')!.id },
      { name: 'Soportes lumbares', categoryId: cat.get('Ortopedia')!.id },
      { name: 'Electrodos', categoryId: cat.get('Consumibles')!.id },
      { name: 'Papel camilla', categoryId: cat.get('Consumibles')!.id },
      { name: 'Guantes', categoryId: cat.get('Consumibles')!.id },
      { name: 'Gasas', categoryId: cat.get('Consumibles')!.id },
    ]),
  );

  const sub = new Map(subcategories.map((s) => [s.name, s]));

  const products = await productRepo.save(
    productRepo.create([
      { code: 'ELEC-001', name: 'Equipo TENS 4 canales', subcategoryId: sub.get('TENS')!.id, stock: 3, minStock: 5, weight: 2.5, requiresRefrigeration: false, serialNumber: 'SN-TENS4C-001', barcode: null },
      { code: 'ELEC-002', name: 'Equipo TENS portátil 2 canales', subcategoryId: sub.get('TENS')!.id, stock: 2, minStock: 3, weight: 0.85, requiresRefrigeration: false, serialNumber: 'SN-TENSP2-001', barcode: null },
      { code: 'ELEC-003', name: 'Ultrasonido terapéutico 1MHz', subcategoryId: sub.get('Ultrasonido')!.id, stock: 4, minStock: 2, weight: 3.2, requiresRefrigeration: false, serialNumber: 'SN-UST1M-001', barcode: null },
      { code: 'ELEC-004', name: 'Láser terapéutico 650nm', subcategoryId: sub.get('Láser terapéutico')!.id, stock: 1, minStock: 2, weight: 1.5, requiresRefrigeration: false, serialNumber: 'SN-LAS650-001', barcode: null },
      { code: 'ELEC-005', name: 'Equipo de magnetoterapia 100 Gauss', subcategoryId: sub.get('Magnetoterapia')!.id, stock: 0, minStock: 2, weight: 4.1, requiresRefrigeration: false, serialNumber: 'SN-MAG100-001', barcode: null },
      { code: 'ELEC-006', name: 'Electroestimulador muscular EMS 8 canales', subcategoryId: sub.get('TENS')!.id, stock: 2, minStock: 2, weight: 3.5, requiresRefrigeration: false, serialNumber: 'SN-EMS8C-001', barcode: null },
      { code: 'TERM-001', name: 'Compresa húmeda estándar 25x40cm', subcategoryId: sub.get('Compresa húmeda')!.id, stock: 18, minStock: 10, weight: 0.42, requiresRefrigeration: false, serialNumber: null, barcode: '7702011000014' },
      { code: 'TERM-002', name: 'Compresa húmeda cervical 24x61cm', subcategoryId: sub.get('Compresa húmeda')!.id, stock: 8, minStock: 5, weight: 0.36, requiresRefrigeration: false, serialNumber: null, barcode: '7702011000021' },
      { code: 'TERM-003', name: 'Parafina terapéutica 2.5kg', subcategoryId: sub.get('Parafina')!.id, stock: 12, minStock: 6, weight: 2.5, requiresRefrigeration: false, serialNumber: null, barcode: '7702011000038' },
      { code: 'TERM-004', name: 'Lámpara infrarroja 150W', subcategoryId: sub.get('Infrarrojos')!.id, stock: 3, minStock: 2, weight: 2.8, requiresRefrigeration: false, serialNumber: null, barcode: '7702011000045' },
      { code: 'TERM-005', name: 'Bañera para parafina con bandeja', subcategoryId: sub.get('Parafina')!.id, stock: 0, minStock: 1, weight: 5.5, requiresRefrigeration: false, serialNumber: null, barcode: null },
      { code: 'HIDR-001', name: 'Turbina hidromasaje portátil', subcategoryId: sub.get('Turbinas')!.id, stock: 2, minStock: 1, weight: 6.1, requiresRefrigeration: false, serialNumber: null, barcode: null },
      { code: 'HIDR-002', name: 'Tanque de remojo para miembros', subcategoryId: sub.get('Tanques')!.id, stock: 1, minStock: 1, weight: 8.5, requiresRefrigeration: false, serialNumber: null, barcode: null },
      { code: 'HIDR-003', name: 'Manguera flexible 1.5m', subcategoryId: sub.get('Accesorios')!.id, stock: 5, minStock: 3, weight: 0.32, requiresRefrigeration: false, serialNumber: null, barcode: null },
      { code: 'FARM-001', name: 'Diclofenaco dietilamonio gel 1% 50g', subcategoryId: sub.get('Antiinflamatorios')!.id, stock: 6, minStock: 10, weight: 0.055, requiresRefrigeration: true, serialNumber: null, barcode: '7700123400015' },
      { code: 'FARM-002', name: 'Gel conductor terapéutico 500ml', subcategoryId: sub.get('Geles conductores')!.id, stock: 24, minStock: 12, weight: 0.555, requiresRefrigeration: true, serialNumber: null, barcode: '7700123400022' },
      { code: 'FARM-003', name: 'Ibuprofeno 400mg x20 tab', subcategoryId: sub.get('Antiinflamatorios')!.id, stock: 15, minStock: 8, weight: 0.08, requiresRefrigeration: true, serialNumber: null, barcode: '7700123400039' },
      { code: 'FARM-004', name: 'Tramadol 50mg x10 cáp', subcategoryId: sub.get('Analgésicos')!.id, stock: 0, minStock: 5, weight: 0.042, requiresRefrigeration: true, serialNumber: null, barcode: '7700123400046' },
      { code: 'ORT-001', name: 'Férula para muñeca talla M', subcategoryId: sub.get('Férulas')!.id, stock: 14, minStock: 5, weight: 0.2, requiresRefrigeration: false, serialNumber: null, barcode: '7703456700012' },
      { code: 'ORT-002', name: 'Soporte lumbar con ballenas talla L', subcategoryId: sub.get('Soportes lumbares')!.id, stock: 7, minStock: 4, weight: 0.65, requiresRefrigeration: false, serialNumber: null, barcode: '7703456700029' },
      { code: 'ORT-003', name: 'Vendaje elástico 10cm x5m', subcategoryId: sub.get('Vendajes')!.id, stock: 30, minStock: 15, weight: 0.09, requiresRefrigeration: false, serialNumber: null, barcode: '7703456700036' },
      { code: 'ORT-004', name: 'Collarín cervical blando talla M', subcategoryId: sub.get('Férulas')!.id, stock: 9, minStock: 3, weight: 0.12, requiresRefrigeration: false, serialNumber: null, barcode: '7703456700043' },
      { code: 'CONS-001', name: 'Electrodos autoadhesivos 40x40mm x100u', subcategoryId: sub.get('Electrodos')!.id, stock: 85, minStock: 30, weight: 0.18, requiresRefrigeration: false, serialNumber: null, barcode: '7704567800011' },
      { code: 'CONS-002', name: 'Papel camilla 60cm x80m', subcategoryId: sub.get('Papel camilla')!.id, stock: 6, minStock: 4, weight: 3.2, requiresRefrigeration: false, serialNumber: null, barcode: '7704567800028' },
      { code: 'CONS-003', name: 'Guantes nitrilo talla M x100u', subcategoryId: sub.get('Guantes')!.id, stock: 22, minStock: 10, weight: 0.85, requiresRefrigeration: false, serialNumber: null, barcode: '7704567800035' },
      { code: 'CONS-004', name: 'Gasas estériles 10x10cm x50u', subcategoryId: sub.get('Gasas')!.id, stock: 40, minStock: 20, weight: 0.15, requiresRefrigeration: false, serialNumber: null, barcode: '7704567800042' },
      { code: 'CONS-005', name: 'Electrodos Karaya 40x40mm x50u', subcategoryId: sub.get('Electrodos')!.id, stock: 3, minStock: 10, weight: 0.12, requiresRefrigeration: false, serialNumber: null, barcode: '7704567800059' },
      { code: 'CONS-006', name: 'Papel camilla desechable 50cm x70m', subcategoryId: sub.get('Papel camilla')!.id, stock: 4, minStock: 3, weight: 2.8, requiresRefrigeration: false, serialNumber: null, barcode: '7704567800066' },
    ]),
  );

  const prod = new Map(products.map((p) => [p.code, p]));

  const clients = await clientRepo.save(
    clientRepo.create([
      { name: 'Centro de Rehabilitación Integral', clientType: ClientType.MAYORISTA, phone: '6024123456', address: 'Calle 5 # 24-50', city: 'Cali', email: 'compras@crintegral.com.co' },
      { name: 'Clínica Fisioterapéutica Los Andes', clientType: ClientType.MAYORISTA, phone: '6013456789', address: 'Carrera 7 # 32-18', city: 'Bogotá', email: 'pedidos@fisioandes.com.co' },
      { name: 'IPS FisioSalud', clientType: ClientType.MAYORISTA, phone: '6044567890', address: 'Carrera 80 # 45-12', city: 'Medellín', email: 'abastecimiento@ipsfisiosaludmed.co' },
      { name: 'Consultorio Fisioterapéutico Torres', clientType: ClientType.DETAL, phone: '3162345678', address: 'Calle 19 # 8-23', city: 'Pereira', email: null },
      { name: 'María Alejandra Vargas', clientType: ClientType.DETAL, phone: '3112345678', address: null, city: 'Cali', email: null },
      { name: 'Clínica del Movimiento', clientType: ClientType.MAYORISTA, phone: '6054678901', address: 'Carrera 46 # 70-21', city: 'Barranquilla', email: 'compras@clinicamovimiento.co' },
      { name: 'Roberto Gómez Castro', clientType: ClientType.DETAL, phone: '3123456789', address: 'Carrera 23 # 12-45', city: 'Manizales', email: null },
      { name: 'Hospital Regional Sur', clientType: ClientType.MAYORISTA, phone: '6027890123', address: 'Avenida Colombia # 15-30', city: 'Pasto', email: 'logistica@hospitalregionalsur.gov.co' },
    ]),
  );

  const cli = new Map(clients.map((c) => [c.name, c]));

  const users = await userRepo.save(
    await Promise.all(
      [
        { nombre: 'Carlos', apellido: 'Mendoza', email: 'admin@stockly.com', rol: UserRole.ADMIN, rawPassword: 'Admin123!' },
        { nombre: 'Laura', apellido: 'Gómez', email: 'almacenista@stockly.com', rol: UserRole.ALMACENISTA, rawPassword: 'Store123!' },
        { nombre: 'Pedro', apellido: 'Ríos', email: 'despachador@stockly.com', rol: UserRole.DESPACHADOR, rawPassword: 'Desp123!' },
        { nombre: 'Ana', apellido: 'Torres', email: 'visualizador@stockly.com', rol: UserRole.VISUALIZADOR, rawPassword: 'View123!' },
      ].map(async ({ rawPassword, ...rest }) =>
        userRepo.create({ ...rest, password: await bcrypt.hash(rawPassword, 12) }),
      ),
    ),
  );

  const admin = users.find((u) => u.email === 'admin@stockly.com')!;
  const almacenista = users.find((u) => u.email === 'almacenista@stockly.com')!;
  const despachador = users.find((u) => u.email === 'despachador@stockly.com')!;

  const movements = await movementRepo.save(
    movementRepo.create([
      { type: MovementType.ENTRADA, productId: prod.get('ELEC-001')!.id, quantity: 5, userId: almacenista.id, date: daysAgo(6), observations: 'Recepción proveedor Biomedical Colombia', targetLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('ELEC-003')!.id, quantity: 4, userId: almacenista.id, date: daysAgo(6, 11), observations: 'Recepción proveedor Biomedical Colombia', targetLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('CONS-001')!.id, quantity: 150, userId: almacenista.id, date: daysAgo(5), observations: 'Pedido mensual electrodos', targetLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('FARM-002')!.id, quantity: 24, userId: almacenista.id, date: daysAgo(5, 11), observations: 'Ingreso geles conductores terapéuticos', targetLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('ORT-001')!.id, quantity: 20, userId: almacenista.id, date: daysAgo(4), observations: 'Recepción proveedor Orthofix Colombia', targetLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('CONS-001')!.id, quantity: 50, userId: despachador.id, date: daysAgo(4, 14), clientId: cli.get('Centro de Rehabilitación Integral')!.id, clientType: ClientType.MAYORISTA, sourceLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('TERM-001')!.id, quantity: 20, userId: almacenista.id, date: daysAgo(3), observations: 'Reposición compresas húmedas', targetLocation: LocationType.BODEGA },
      { type: MovementType.TRASLADO, productId: prod.get('CONS-002')!.id, quantity: 3, userId: almacenista.id, date: daysAgo(3, 10), observations: 'Reabastecimiento vitrina sala de espera', sourceLocation: LocationType.BODEGA, targetLocation: LocationType.VITRINA },
      { type: MovementType.VENTA, productId: prod.get('ORT-001')!.id, quantity: 4, userId: despachador.id, date: daysAgo(3, 15), clientId: cli.get('Clínica Fisioterapéutica Los Andes')!.id, clientType: ClientType.MAYORISTA, sourceLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('FARM-002')!.id, quantity: 3, userId: despachador.id, date: daysAgo(2), clientId: cli.get('Consultorio Fisioterapéutico Torres')!.id, clientType: ClientType.DETAL, sourceLocation: LocationType.BODEGA },
      { type: MovementType.AJUSTE_INGRESO, productId: prod.get('CONS-003')!.id, quantity: 5, userId: admin.id, date: daysAgo(2, 11), observations: 'Ajuste inventario físico — diferencia positiva', targetLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('FARM-003')!.id, quantity: 15, userId: almacenista.id, date: daysAgo(2, 14), observations: 'Recepción farmacéuticos proveedor MedPharma', targetLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('ELEC-001')!.id, quantity: 1, userId: despachador.id, date: daysAgo(1), clientId: cli.get('IPS FisioSalud')!.id, clientType: ClientType.MAYORISTA, sourceLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('CONS-001')!.id, quantity: 15, userId: despachador.id, date: daysAgo(1, 14), clientId: cli.get('Consultorio Fisioterapéutico Torres')!.id, clientType: ClientType.DETAL, sourceLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('ORT-003')!.id, quantity: 10, userId: despachador.id, date: daysAgo(0), clientId: cli.get('Centro de Rehabilitación Integral')!.id, clientType: ClientType.MAYORISTA, sourceLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('CONS-004')!.id, quantity: 8, userId: despachador.id, date: daysAgo(0, 11), clientId: cli.get('IPS FisioSalud')!.id, clientType: ClientType.MAYORISTA, sourceLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('HIDR-001')!.id, quantity: 2, userId: almacenista.id, date: daysAgo(0, 14), observations: 'Recepción equipos hidroterapia', targetLocation: LocationType.BODEGA },
    ]),
  );

  console.log('\n=== Seed completado ===');
  console.log(`Categorías insertadas:    ${categories.length}`);
  console.log(`Subcategorías insertadas: ${subcategories.length}`);
  console.log(`Productos insertados:     ${products.length}`);
  console.log(`Clientes insertados:      ${clients.length}`);
  console.log(`Usuarios insertados:      ${users.length}`);
  console.log(`Movimientos insertados:   ${movements.length}`);
  console.log('\nUsuarios creados:');
  console.log('  admin@stockly.com        → Admin123!   (Admin)');
  console.log('  almacenista@stockly.com  → Store123!   (Almacenista)');
  console.log('  despachador@stockly.com  → Desp123!    (Despachador)');
  console.log('  visualizador@stockly.com → View123!    (Visualizador)');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Error ejecutando seed:', err);
  process.exit(1);
});
