import { NextRequest } from 'next/server';
import { clientController } from '../../src/controller/ClientController';
import { ClientType } from '../../src/entity/ClientType';
import * as clientServiceModule from '../../src/service/ClientService';

const actualClientService = jest.requireActual('../../src/service/ClientService') as typeof import('../../src/service/ClientService');
import * as permissionsModule from '../../src/lib/permissions';

jest.mock('../../src/service/ClientService');
jest.mock('../../src/lib/permissions');

describe('ClientController', () => {
  let mockClientService: jest.Mocked<typeof clientServiceModule.clientService>;
  let mockRequireSession: jest.Mock;
  let mockRequireRoles: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientService = clientServiceModule.clientService as jest.Mocked<typeof clientServiceModule.clientService>;
    mockRequireSession = permissionsModule.requireSession as jest.Mock;
    mockRequireRoles = permissionsModule.requireRoles as jest.Mock;
  });

  describe('getAll', () => {
    it('debe retornar todos los clientes con status 200', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockClientService.getAllClients.mockResolvedValue([
        { id: '1', name: 'Hospital A', clientType: ClientType.DETAL },
        { id: '2', name: 'Clínica B', clientType: ClientType.MAYORISTA },
      ] as any);

      const response = await clientController.getAll();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe('Hospital A');
    });

    it('debe retornar 401 si no hay sesión', async () => {
      const unauthorizedResponse = new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
      mockRequireSession.mockResolvedValue({ ok: false, response: unauthorizedResponse });

      const response = await clientController.getAll();

      expect(response.status).toBe(401);
    });

    it('debe manejar error de servicio', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockClientService.getAllClients.mockRejectedValue(
        new Error('Database error')
      );

      const response = await clientController.getAll();

      expect(response.status).toBe(400);
    });
  });

  describe('create', () => {
    it('debe crear un cliente y retornar 201', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockClientService.createClient.mockResolvedValue({
        id: '1',
        name: 'Hospital Test',
        clientType: ClientType.DETAL,
        isActive: true,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Hospital Test',
          clientType: ClientType.DETAL,
        }),
      });

      const response = await clientController.create(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe('Hospital Test');
    });

    it('debe retornar 403 si el usuario no tiene permisos', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Hospital Test',
          clientType: ClientType.DETAL,
        }),
      });

      const response = await clientController.create(request);

      expect(response.status).toBe(403);
    });

    it('debe retornar 400 si el nombre es muy corto', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockClientService.createClient.mockImplementation(async (body) => {
        actualClientService.createClientSchema.parse(body);
        return {} as any;
      });

      const request = new NextRequest('http://localhost/api/v1/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: 'A',
          clientType: ClientType.DETAL,
        }),
      });

      const response = await clientController.create(request);

      expect(response.status).toBe(400);
    });

    it('debe validar que clientType sea requerido', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockClientService.createClient.mockImplementation(async (body) => {
        actualClientService.createClientSchema.parse(body);
        return {} as any;
      });

      const request = new NextRequest('http://localhost/api/v1/clients', {
        method: 'POST',
        body: JSON.stringify({ name: 'Hospital Test' }),
      });

      const response = await clientController.create(request);

      expect(response.status).toBe(400);
    });

    it('debe manejar error de email duplicado', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockClientService.createClient.mockRejectedValue(
        new Error('El email ya está registrado')
      );

      const request = new NextRequest('http://localhost/api/v1/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Hospital Test',
          clientType: ClientType.DETAL,
          email: 'test@hospital.com',
        }),
      });

      const response = await clientController.create(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('email');
    });
  });

  describe('getById', () => {
    it('debe retornar un cliente por id con status 200', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockClientService.getClientById.mockResolvedValue({
        id: '1',
        name: 'Hospital A',
        clientType: ClientType.DETAL,
        isActive: true,
      } as any);

      const response = await clientController.getById('1');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe('Hospital A');
    });

    it('debe retornar 401 sin sesión', async () => {
      const unauthorizedResponse = new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
      mockRequireSession.mockResolvedValue({ ok: false, response: unauthorizedResponse });

      const response = await clientController.getById('1');

      expect(response.status).toBe(401);
    });

    it('debe retornar 404 si el cliente no existe', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockClientService.getClientById.mockRejectedValue(
        new Error('Cliente no encontrado')
      );

      const request = new NextRequest('http://localhost/api/v1/clients/invalid-id');
      const response = await clientController.getById(request, 'invalid-id');

      expect(response.status).toBe(404);
    });
  });

  describe('delete', () => {
    it('debe eliminar un cliente y retornar 200', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockClientService.deleteClient.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/v1/clients/1', {
        method: 'DELETE',
      });
      const response = await clientController.delete(request, '1');

      expect(response.status).toBe(200);
      expect(mockClientService.deleteClient).toHaveBeenCalledWith('1');
    });

    it('debe retornar 403 sin permisos', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const response = await clientController.delete('1');

      expect(response.status).toBe(403);
    });

    it('debe retornar 404 si el cliente no existe', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockClientService.deleteClient.mockRejectedValue(
        new Error('Cliente no encontrado')
      );

      const request = new NextRequest('http://localhost/api/v1/clients/invalid-id', {
        method: 'DELETE',
      });
      const response = await clientController.delete(request, 'invalid-id');

      expect(response.status).toBe(404);
    });
  });
});
