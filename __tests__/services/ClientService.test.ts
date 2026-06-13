import { clientService } from '../../src/service/ClientService';
import { ClientType } from '../../src/entity/ClientType';
import * as clientRepoModule from '../../src/repository/ClientRepository';

jest.mock('../../src/repository/ClientRepository');

describe('ClientService', () => {
  let service: typeof clientService;
  let mockClientRepo: jest.Mocked<typeof clientRepoModule.clientRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientRepo = clientRepoModule.clientRepository as jest.Mocked<typeof clientRepoModule.clientRepository>;
    service = clientService;
  });

  describe('createClient', () => {
    it('debe crear un cliente válido', async () => {
      const dto = {
        name: 'Hospital Santa María',
        clientType: ClientType.DETAL,
        phone: '3001234567',
        address: 'Calle 10 #5-50',
        city: 'Medellín',
        email: 'hospital@example.com',
      };

      mockClientRepo.existsByEmail.mockResolvedValue(false);
      mockClientRepo.create.mockReturnValue({
        name: 'Hospital Santa María',
        clientType: ClientType.DETAL,
      } as any);
      mockClientRepo.save.mockResolvedValue({
        id: '1',
        ...dto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      const result = await service.createClient(dto);

      expect(result.name).toBe('Hospital Santa María');
      expect(result.clientType).toBe(ClientType.DETAL);
      expect(mockClientRepo.create).toHaveBeenCalled();
      expect(mockClientRepo.save).toHaveBeenCalled();
    });

    it('debe rechazar si el email ya existe', async () => {
      mockClientRepo.existsByEmail.mockResolvedValue(true);

      await expect(
        service.createClient({
          name: 'Clínica Nueva',
          clientType: ClientType.MAYORISTA,
          email: 'taken@example.com',
        })
      ).rejects.toThrow('El email');
    });

    it('debe validar que el nombre tenga al menos 2 caracteres', async () => {
      await expect(
        service.createClient({
          name: 'A',
          clientType: ClientType.DETAL,
        })
      ).rejects.toThrow();
    });

    it('debe validar formato de email', async () => {
      mockClientRepo.existsByEmail.mockResolvedValue(false);

      await expect(
        service.createClient({
          name: 'Hospital Test',
          clientType: ClientType.DETAL,
          email: 'invalid-email',
        })
      ).rejects.toThrow();
    });

    it('debe permitir crear cliente sin email', async () => {
      mockClientRepo.create.mockReturnValue({
        name: 'Cliente Sin Email',
        clientType: ClientType.DETAL,
      } as any);
      mockClientRepo.save.mockResolvedValue({
        id: '1',
        name: 'Cliente Sin Email',
        clientType: ClientType.DETAL,
        email: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      const result = await service.createClient({
        name: 'Cliente Sin Email',
        clientType: ClientType.DETAL,
      });

      expect(result.email).toBeNull();
      expect(mockClientRepo.existsByEmail).not.toHaveBeenCalled();
    });

    it('debe validar clientType requerido', async () => {
      await expect(
        service.createClient({
          name: 'Test',
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('getAllClients', () => {
    it('debe retornar todos los clientes activos', async () => {
      const mockClients = [
        { id: '1', name: 'Hospital 1', clientType: ClientType.DETAL },
        { id: '2', name: 'Clínica 1', clientType: ClientType.MAYORISTA },
      ];

      mockClientRepo.findAllActive.mockResolvedValue(mockClients as any);

      const result = await service.getAllClients();

      expect(result).toEqual(mockClients);
      expect(mockClientRepo.findAllActive).toHaveBeenCalled();
    });
  });

  describe('getClientById', () => {
    it('debe retornar un cliente por id', async () => {
      const clientId = '1';
      const mockClient = {
        id: clientId,
        name: 'Hospital Test',
        clientType: ClientType.DETAL,
        isActive: true,
      };

      mockClientRepo.findById.mockResolvedValue(mockClient as any);

      const result = await service.getClientById(clientId);

      expect(result).toEqual(mockClient);
      expect(mockClientRepo.findById).toHaveBeenCalledWith(clientId);
    });

    it('debe lanzar error si el cliente no existe', async () => {
      mockClientRepo.findById.mockResolvedValue(null);

      await expect(service.getClientById('invalid-id')).rejects.toThrow('Cliente no encontrado');
    });
  });

  describe('updateClient', () => {
    it('debe actualizar un cliente existente', async () => {
      const clientId = '1';
      const existingClient = {
        id: clientId,
        name: 'Hospital Original',
        clientType: ClientType.DETAL,
        email: 'old@example.com',
        isActive: true,
      };

      mockClientRepo.findById.mockResolvedValue(existingClient as any);
      mockClientRepo.save.mockResolvedValue({
        ...existingClient,
        name: 'Hospital Actualizado',
      } as any);

      const result = await service.updateClient(clientId, { name: 'Hospital Actualizado' });

      expect(result.name).toBe('Hospital Actualizado');
      expect(mockClientRepo.save).toHaveBeenCalled();
    });

    it('debe validar que el nuevo email no sea duplicado', async () => {
      const clientId = '1';
      mockClientRepo.findById.mockResolvedValue({
        id: clientId,
        name: 'Hospital Test',
        email: 'old@example.com',
        isActive: true,
      } as any);
      mockClientRepo.existsByEmail.mockResolvedValue(true);

      await expect(
        service.updateClient(clientId, { email: 'taken@example.com' })
      ).rejects.toThrow('El email');
    });

    it('debe permitir actualizar sin cambiar email', async () => {
      const clientId = '1';
      const existingClient = {
        id: clientId,
        name: 'Hospital Test',
        email: 'hospital@example.com',
        phone: '3001111111',
        isActive: true,
      };

      mockClientRepo.findById.mockResolvedValue(existingClient as any);
      mockClientRepo.save.mockResolvedValue({
        ...existingClient,
        phone: '3002222222',
      } as any);

      await service.updateClient(clientId, { phone: '3002222222' });

      expect(mockClientRepo.existsByEmail).not.toHaveBeenCalled();
      expect(mockClientRepo.save).toHaveBeenCalled();
    });

    it('debe lanzar error si intenta actualizar cliente inexistente', async () => {
      mockClientRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateClient('invalid-id', { name: 'Nuevo' })
      ).rejects.toThrow('Cliente no encontrado');
    });
  });

  describe('deleteClient', () => {
    it('debe eliminar un cliente existente', async () => {
      const clientId = '1';
      mockClientRepo.findById.mockResolvedValue({
        id: clientId,
        name: 'Hospital Test',
        isActive: true,
      } as any);
      mockClientRepo.softDelete.mockResolvedValue(undefined);

      await service.deleteClient(clientId);

      expect(mockClientRepo.softDelete).toHaveBeenCalledWith(clientId);
    });

    it('debe lanzar error si intenta eliminar cliente inexistente', async () => {
      mockClientRepo.findById.mockResolvedValue(null);

      await expect(service.deleteClient('invalid-id')).rejects.toThrow('Cliente no encontrado');
    });
  });

  describe('searchByName', () => {
    it('debe buscar clientes por nombre', async () => {
      const mockResults = [
        { id: '1', name: 'Hospital San Juan', clientType: ClientType.DETAL },
      ];

      mockClientRepo.findByName.mockResolvedValue(mockResults as any);

      const result = await service.searchByName('San Juan');

      expect(result).toEqual(mockResults);
      expect(mockClientRepo.findByName).toHaveBeenCalledWith('San Juan');
    });

    it('debe retornar lista vacía para búsqueda vacía', async () => {
      const result = await service.searchByName('');

      expect(result).toEqual([]);
      expect(mockClientRepo.findByName).not.toHaveBeenCalled();
    });

    it('debe retornar lista vacía para búsqueda con solo espacios', async () => {
      const result = await service.searchByName('   ');

      expect(result).toEqual([]);
      expect(mockClientRepo.findByName).not.toHaveBeenCalled();
    });
  });
});
