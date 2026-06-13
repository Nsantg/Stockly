import { NextRequest } from 'next/server';
import { alertController } from '../../src/controller/AlertController';
import * as alertServiceModule from '../../src/service/AlertService';
import * as permissionsModule from '../../src/lib/permissions';

jest.mock('../../src/service/AlertService');
jest.mock('../../src/lib/permissions');

describe('AlertController', () => {
  let mockAlertService: jest.Mocked<typeof alertServiceModule.alertService>;
  let mockRequireSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlertService = alertServiceModule.alertService as jest.Mocked<typeof alertServiceModule.alertService>;
    mockRequireSession = permissionsModule.requireSession as jest.Mock;
  });

  describe('getStockAlerts', () => {
    it('debe retornar lista de alertas de stock', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockAlertService.getStockAlerts.mockResolvedValue([
        { productId: '1', productCode: 'PROD-001', currentStock: 5, minimumStock: 10 },
        { productId: '2', productCode: 'PROD-002', currentStock: 0, minimumStock: 5 },
      ] as any);

      const request = new NextRequest('http://localhost/api/v1/alerts/stock', {
        method: 'GET',
      });

      const response = await alertController.getStockAlerts(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].productCode).toBe('PROD-001');
    });

    it('debe retornar lista vacía si no hay alertas', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockAlertService.getStockAlerts.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/v1/alerts/stock', {
        method: 'GET',
      });

      const response = await alertController.getStockAlerts(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });

    it('debe retornar 401 sin sesión', async () => {
      const unauthorizedResponse = new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
      mockRequireSession.mockResolvedValue({ ok: false, response: unauthorizedResponse });

      const request = new NextRequest('http://localhost/api/v1/alerts/stock', {
        method: 'GET',
      });

      const response = await alertController.getStockAlerts(request);

      expect(response.status).toBe(401);
    });

    it('debe manejar error de servicio', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockAlertService.getStockAlerts.mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/v1/alerts/stock', {
        method: 'GET',
      });

      const response = await alertController.getStockAlerts(request);

      expect(response.status).toBe(400);
    });
  });

  describe('getExpirationAlerts', () => {
    it('debe retornar lista de alertas de vencimiento', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockAlertService.getExpirationAlerts.mockResolvedValue([
        { lotId: '1', expirationDate: new Date('2024-12-25'), daysUntilExpiration: 5, level: 'CRITICAL' },
        { lotId: '2', expirationDate: new Date('2024-12-30'), daysUntilExpiration: 10, level: 'WARNING' },
      ] as any);

      const request = new NextRequest('http://localhost/api/v1/alerts/expiration', {
        method: 'GET',
      });

      const response = await alertController.getExpirationAlerts(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].level).toBe('CRITICAL');
    });

    it('debe filtrar por número de días', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockAlertService.getExpirationAlerts.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/v1/alerts/expiration?days=30', {
        method: 'GET',
      });

      const response = await alertController.getExpirationAlerts(request);

      expect(response.status).toBe(200);
      expect(mockAlertService.getExpirationAlerts).toHaveBeenCalledWith(30);
    });

    it('debe retornar 401 sin sesión', async () => {
      const unauthorizedResponse = new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
      mockRequireSession.mockResolvedValue({ ok: false, response: unauthorizedResponse });

      const request = new NextRequest('http://localhost/api/v1/alerts/expiration', {
        method: 'GET',
      });

      const response = await alertController.getExpirationAlerts(request);

      expect(response.status).toBe(401);
    });

    it('debe usar valor por defecto si days no se proporciona', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockAlertService.getExpirationAlerts.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/v1/alerts/expiration', {
        method: 'GET',
      });

      const response = await alertController.getExpirationAlerts(request);

      expect(response.status).toBe(200);
      expect(mockAlertService.getExpirationAlerts).toHaveBeenCalledWith(30);
    });
  });

  describe('getAllAlerts', () => {
    it('debe retornar resumen de alertas', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockAlertService.getAllAlerts.mockResolvedValue({
        totalCritical: 3,
        totalWarning: 5,
        stockAlerts: [
          { productId: '1', currentStock: 5 },
        ],
        expirationAlerts: [
          { lotId: '1', level: 'CRITICAL' },
          { lotId: '2', level: 'WARNING' },
        ],
      } as any);

      const request = new NextRequest('http://localhost/api/v1/alerts', {
        method: 'GET',
      });

      const response = await alertController.getAllAlerts(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.totalCritical).toBe(3);
      expect(data.totalWarning).toBe(5);
    });

    it('debe retornar 401 sin sesión', async () => {
      const unauthorizedResponse = new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
      mockRequireSession.mockResolvedValue({ ok: false, response: unauthorizedResponse });

      const request = new NextRequest('http://localhost/api/v1/alerts', {
        method: 'GET',
      });

      const response = await alertController.getAllAlerts(request);

      expect(response.status).toBe(401);
    });

    it('debe manejar error de servicio', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockAlertService.getAllAlerts.mockRejectedValue(
        new Error('Service error')
      );

      const request = new NextRequest('http://localhost/api/v1/alerts', {
        method: 'GET',
      });

      const response = await alertController.getAllAlerts(request);

      expect(response.status).toBe(400);
    });
  });
});
