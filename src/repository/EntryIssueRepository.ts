import { getDataSource } from '../lib/database';
import { EntryIssue, EntryIssueType } from '../entity/EntryIssue';

class EntryIssueRepository {
  private async getRepo() {
    const ds = await getDataSource();
    return ds.getRepository(EntryIssue);
  }

  async findUnresolved(): Promise<EntryIssue[]> {
    const repo = await this.getRepo();
    return repo.find({ where: { isResolved: false }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<EntryIssue | null> {
    const repo = await this.getRepo();
    return repo.findOne({ where: { id } });
  }

  async insert(data: {
    movementId: string;
    productId: string;
    productName: string;
    quantity: number;
    issueType: EntryIssueType;
  }): Promise<EntryIssue> {
    const repo = await this.getRepo();
    const issue = repo.create({ ...data, isResolved: false, resolvedByMovementId: null, resolvedAt: null });
    return repo.save(issue);
  }

  async resolve(id: string, resolvedByMovementId: string): Promise<void> {
    const repo = await this.getRepo();
    await repo.update(id, { isResolved: true, resolvedByMovementId, resolvedAt: new Date() });
  }
}

export const entryIssueRepository = new EntryIssueRepository();
