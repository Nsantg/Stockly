import { getDataSource } from '../lib/database';
import { Client } from '../entity/Client';

class ClientRepository {
  private async getRepo() {
    return (await getDataSource()).getRepository(Client);
  }

  findAllActive(): Promise<Client[]> {
    return this.getRepo().then((repo) =>
      repo.find({ where: { isActive: true }, order: { name: 'ASC' } }),
    );
  }

  findById(id: string): Promise<Client | null> {
    return this.getRepo().then((repo) =>
      repo.findOne({ where: { id, isActive: true } }),
    );
  }

  findByName(name: string): Promise<Pick<Client, 'id' | 'name' | 'clientType'>[]> {
    return this.getRepo().then((repo) =>
      repo
        .createQueryBuilder('client')
        .select(['client.id', 'client.name', 'client.clientType'])
        .where('client.isActive = :isActive', { isActive: true })
        .andWhere('client.deletedAt IS NULL')
        .andWhere('LOWER(client.name) LIKE LOWER(:name)', { name: `%${name}%` })
        .orderBy('client.name', 'ASC')
        .limit(10)
        .getMany(),
    );
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const repo = await this.getRepo();
    const qb = repo
      .createQueryBuilder('client')
      .where('client.email = :email', { email })
      .andWhere('client.isActive = :isActive', { isActive: true })
      .andWhere('client.deletedAt IS NULL');

    if (excludeId) {
      qb.andWhere('client.id != :excludeId', { excludeId });
    }

    return (await qb.getCount()) > 0;
  }

  create(data: Partial<Client>): Promise<Client> {
    return this.getRepo().then((repo) => repo.create(data) as Client);
  }

  save(client: Client): Promise<Client> {
    return this.getRepo().then((repo) => repo.save(client));
  }

  async softDelete(id: string): Promise<void> {
    const repo = await this.getRepo();
    await repo.softDelete(id);
  }
}

export const clientRepository = new ClientRepository();
