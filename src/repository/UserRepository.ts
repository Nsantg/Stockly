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

  async findAllActive(): Promise<User[]> {
    return (await this.getRepo()).find({ where: { isActive: true } });
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await (await this.getRepo()).count({ where: { email } });
    return count > 0;
  }

  async create(data: Partial<User>): Promise<User> {
    return (await this.getRepo()).create(data);
  }

  async save(user: User): Promise<User> {
    return (await this.getRepo()).save(user);
  }
}

export const userRepository = new UserRepository();
