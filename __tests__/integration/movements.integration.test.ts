import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppDataSource, getDataSource } from '../../src/lib/database';
import { MovementType } from '../../src/entity/MovementType';
import { ClientType } from '../../src/entity/ClientType';
import { UserRole } from '../../src/entity/UserRole';
import { Movement } from '../../src/entity/Movement';
import { startTestServer, stopTestServer } from './helpers/testServer';
import {
  clearDatabase,
  countMovements,
  FIXTURE_IDS,
  getProductStock,
  seedTestFixtures,
} from './helpers/testDatabase';
import { clearSessionMock, mockNoSession, mockSession } from './helpers/sessionMock';

describe('Integración API /api/v1/movements', () => {
  let agent: ReturnType<typeof supertest>;
  let dataSource: DataSource;

  beforeAll(async () => {
    agent = await startTestServer();
    dataSource = await getDataSource();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await clearDatabase(dataSource);
      await AppDataSource.destroy();
    }
    await stopTestServer();
  });

  afterEach(async () => {
    clearSessionMock();
    if (dataSource?.isInitialized) {
      await clearDatabase(dataSource);
    }
  });

  describe('Escenario 1 — Logística de Salida (POST /api/v1/movements — VENTA)', () => {
    const ventaPayload = {
      type: MovementType.VENTA,
      productId: FIXTURE_IDS.productId,
      quantity: 5,
      clientId: FIXTURE_IDS.clientId,
      clientType: ClientType.DETAL,
    };

    beforeEach(async () => {
      await seedTestFixtures(dataSource);
      mockSession({ id: FIXTURE_IDS.despachadorUserId, rol: UserRole.DESPACHADOR });
    });

    it('descuenta el stock correctamente tras una venta exitosa', async () => {
      // CP-10 | RF-07, RF-08 — Despacho exitoso que descuenta stock del producto
      const stockBefore = await getProductStock(dataSource);

      // Act
      const response = await agent
        .post('/api/v1/movements')
        .set('Content-Type', 'application/json')
        .send(ventaPayload);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.movement).toMatchObject({
        type: MovementType.VENTA,
        productId: FIXTURE_IDS.productId,
        quantity: 5,
        isAnnulled: false,
      });
      expect(await getProductStock(dataSource)).toBe(stockBefore - ventaPayload.quantity);
    });

    it('responde 400 y no altera la BD cuando no hay stock suficiente', async () => {
      // CP-11 | RF-09, RN-06 — Rechazo de despacho por stock insuficiente
      await clearDatabase(dataSource);
      await seedTestFixtures(dataSource, { productStock: 3 });

      const stockBefore = await getProductStock(dataSource);
      const movementsBefore = await countMovements(dataSource);

      // Act
      const response = await agent
        .post('/api/v1/movements')
        .set('Content-Type', 'application/json')
        .send({ ...ventaPayload, quantity: 10 });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/stock insuficiente/i);
      expect(await getProductStock(dataSource)).toBe(stockBefore);
      expect(await countMovements(dataSource)).toBe(movementsBefore);
    });

    it('crea el registro de auditoría (Movement) exitosamente', async () => {
      // CP-21 | RF-17 — Registro automático del movimiento en la trazabilidad
      const movementsBefore = await countMovements(dataSource);

      // Act
      const response = await agent
        .post('/api/v1/movements')
        .set('Content-Type', 'application/json')
        .send(ventaPayload);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.movement.id).toBeDefined();
      expect(await countMovements(dataSource)).toBe(movementsBefore + 1);

      const persisted = await dataSource.getRepository(Movement).findOneBy({
        id: response.body.movement.id,
      });
      expect(persisted).toMatchObject({
        type: MovementType.VENTA,
        productId: FIXTURE_IDS.productId,
        quantity: ventaPayload.quantity,
        userId: FIXTURE_IDS.despachadorUserId,
        clientId: FIXTURE_IDS.clientId,
        isAnnulled: false,
      });
    });
  });

  describe('Escenario 2 — Trazabilidad (PATCH /api/v1/movements/{id}/annul)', () => {
    beforeEach(async () => {
      await seedTestFixtures(dataSource);
      mockSession({ id: FIXTURE_IDS.despachadorUserId, rol: UserRole.DESPACHADOR });

      await agent
        .post('/api/v1/movements')
        .set('Content-Type', 'application/json')
        .send({
          type: MovementType.VENTA,
          productId: FIXTURE_IDS.productId,
          quantity: 8,
          clientId: FIXTURE_IDS.clientId,
          clientType: ClientType.DETAL,
        });
    });

    it('marca isAnnulled en true y revierte el stock de la venta', async () => {
      // CP-05, CP-23 | RNF-06 — Anulación con soft delete y reversión de inventario
      const stockAfterSale = await getProductStock(dataSource);
      expect(stockAfterSale).toBe(42);

      const saleMovement = await dataSource.getRepository(Movement).findOneBy({
        productId: FIXTURE_IDS.productId,
        type: MovementType.VENTA,
      });
      expect(saleMovement).not.toBeNull();

      mockSession({ id: FIXTURE_IDS.adminUserId, rol: UserRole.ADMIN });

      // Act
      const response = await agent
        .patch(`/api/v1/movements/${saleMovement!.id}/annul`)
        .set('Content-Type', 'application/json')
        .send({ reason: 'Error en el despacho registrado' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: saleMovement!.id,
        isAnnulled: true,
        annulledReason: 'Error en el despacho registrado',
        annulledById: FIXTURE_IDS.adminUserId,
      });
      expect(response.body.annulledAt).toBeTruthy();
      expect(await getProductStock(dataSource)).toBe(50);
    });
  });

  describe('Escenario 3 — Seguridad (autenticación y roles)', () => {
    const adminOnlyPayload = {
      type: MovementType.ENTRADA,
      productId: FIXTURE_IDS.productId,
      quantity: 5,
    };

    beforeEach(async () => {
      await seedTestFixtures(dataSource);
    });

    it('rechaza POST /api/v1/movements sin sesión activa', async () => {
      // CP-20 | RF-16, RNF-03 — Acceso denegado sin token de sesión válido
      mockNoSession();
      const stockBefore = await getProductStock(dataSource);
      const movementsBefore = await countMovements(dataSource);

      // Act
      const response = await agent
        .post('/api/v1/movements')
        .set('Content-Type', 'application/json')
        .send(adminOnlyPayload);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No autorizado');
      expect(response.body.details).toContain('sesión activa');
      expect(await getProductStock(dataSource)).toBe(stockBefore);
      expect(await countMovements(dataSource)).toBe(movementsBefore);
    });

    it('rechaza con 403 cuando Despachador intenta una acción reservada a Admin/Almacenista', async () => {
      // CP-20 | RF-16, RNF-03 — Despachador no puede registrar entradas de inventario
      mockSession({ id: FIXTURE_IDS.despachadorUserId, rol: UserRole.DESPACHADOR });
      const stockBefore = await getProductStock(dataSource);
      const movementsBefore = await countMovements(dataSource);

      // Act
      const response = await agent
        .post('/api/v1/movements')
        .set('Content-Type', 'application/json')
        .send(adminOnlyPayload);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acceso prohibido');
      expect(response.body.details).toMatch(/Admin|Almacenista/);
      expect(await getProductStock(dataSource)).toBe(stockBefore);
      expect(await countMovements(dataSource)).toBe(movementsBefore);
    });

    it('rechaza con 403 cuando Despachador intenta anular un movimiento', async () => {
      // CP-20 | RF-16 — Anulación restringida a Admin y Almacenista
      mockSession({ id: FIXTURE_IDS.despachadorUserId, rol: UserRole.DESPACHADOR });

      const createResponse = await agent
        .post('/api/v1/movements')
        .set('Content-Type', 'application/json')
        .send({
          type: MovementType.VENTA,
          productId: FIXTURE_IDS.productId,
          quantity: 2,
          clientId: FIXTURE_IDS.clientId,
          clientType: ClientType.DETAL,
        });
      expect(createResponse.status).toBe(201);

      const movementId = createResponse.body.movement.id as string;
      const stockAfterSale = await getProductStock(dataSource);

      // Act
      const response = await agent
        .patch(`/api/v1/movements/${movementId}/annul`)
        .set('Content-Type', 'application/json')
        .send({ reason: 'Intento no autorizado' });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acceso prohibido');
      expect(await getProductStock(dataSource)).toBe(stockAfterSale);

      const movement = await dataSource.getRepository(Movement).findOneBy({ id: movementId });
      expect(movement?.isAnnulled).toBe(false);
    });
  });
});
