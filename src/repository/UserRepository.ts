import { getDataSource } from '../lib/database';
import { User } from '../entity/User';

class UserRepository {
  private async getRepo() {
    const ds = await getDataSource();
    return ds.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return (await this.getRepo()).findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return (await this.getRepo()).findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return (await this.getRepo()).find({ order: { createdAt: 'ASC' } });
  }

  async findAllActive(): Promise<User[]> {
    return (await this.getRepo()).find({ where: { isActive: true } });
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const qb = (await this.getRepo())
      .createQueryBuilder('u')
      .where('u.email = :email', { email });
    if (excludeId) qb.andWhere('u.id != :excludeId', { excludeId });
    return (await qb.getCount()) > 0;
  }

  async create(data: Partial<User>): Promise<User> {
    return (await this.getRepo()).create(data);
  }

  async save(user: User): Promise<User> {
    return (await this.getRepo()).save(user);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    await (await this.getRepo()).update(id, data);
  }

  async deactivate(id: string): Promise<void> {
    await (await this.getRepo()).update(id, { isActive: false });
  }
}

export const userRepository = new UserRepository();
