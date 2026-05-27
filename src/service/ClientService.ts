import { z } from 'zod';
import { clientRepository } from '../repository/ClientRepository';
import { Client } from '../entity/Client';
import { ClientType } from '../entity/ClientType';

export const createClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
  clientType: z.nativeEnum(ClientType),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  email: z.string().email('El email no es válido').optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;

class ClientService {
  async createClient(dto: CreateClientDto): Promise<Client> {
    const data = createClientSchema.parse(dto);

    if (data.email) {
      const emailInUse = await clientRepository.existsByEmail(data.email);
      if (emailInUse) {
        throw new Error(`El email "${data.email}" ya está registrado`);
      }
    }

    const client = await clientRepository.create(data as Partial<Client>);
    return clientRepository.save(client);
  }

  getAllClients(): Promise<Client[]> {
    return clientRepository.findAllActive();
  }

  async getClientById(id: string): Promise<Client> {
    const client = await clientRepository.findById(id);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }
    return client;
  }

  async updateClient(id: string, dto: UpdateClientDto): Promise<Client> {
    const client = await this.getClientById(id);
    const data = updateClientSchema.parse(dto);

    if (data.email && data.email !== client.email) {
      const emailInUse = await clientRepository.existsByEmail(data.email, id);
      if (emailInUse) {
        throw new Error(`El email "${data.email}" ya está registrado`);
      }
    }

    Object.assign(client, data);
    return clientRepository.save(client);
  }

  async deleteClient(id: string): Promise<void> {
    await this.getClientById(id);
    await clientRepository.softDelete(id);
  }

  searchByName(query: string): Promise<Pick<Client, 'id' | 'name' | 'clientType'>[]> {
    if (!query || query.trim().length === 0) return Promise.resolve([]);
    return clientRepository.findByName(query.trim());
  }
}

export const clientService = new ClientService();
