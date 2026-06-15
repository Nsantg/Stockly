import { entryIssueRepository } from '../repository/EntryIssueRepository';
import { EntryIssue, EntryIssueType } from '../entity/EntryIssue';
import { BusinessError } from '../lib/errors';

class EntryIssueService {
  getUnresolved(): Promise<EntryIssue[]> {
    return entryIssueRepository.findUnresolved();
  }

  create(data: {
    movementId: string;
    productId: string;
    productName: string;
    quantity: number;
    issueType: EntryIssueType;
  }): Promise<EntryIssue> {
    return entryIssueRepository.insert(data);
  }

  async resolve(id: string, resolvedByMovementId: string): Promise<void> {
    const issue = await entryIssueRepository.findById(id);
    if (!issue || issue.isResolved) throw new BusinessError('Alerta no encontrada o ya resuelta');
    await entryIssueRepository.resolve(id, resolvedByMovementId);
  }
}

export const entryIssueService = new EntryIssueService();
