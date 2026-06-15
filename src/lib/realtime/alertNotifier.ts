import { getIO } from './socketServer';
import { alertService } from '../../service/AlertService';
import { productRepository } from '../../repository/ProductRepository';
import type { EntryIssue } from '../../entity/EntryIssue';

export async function broadcastSummary(daysAhead = 30): Promise<void> {
  const io = getIO();
  if (!io) return;
  try {
    const summary = await alertService.getAllAlerts(daysAhead);
    io.to('alerts').emit('alerts:summary', summary);
  } catch (err) {
    console.error('[alertNotifier] broadcastSummary error:', err);
  }
}

export async function notifyStockChange(productId: string): Promise<void> {
  const io = getIO();
  if (!io) return;
  try {
    const product = await productRepository.findById(productId);
    if (product && product.stock <= product.minStock) {
      io.to('alerts').emit('alerts:toast', {
        level: 'critical',
        title: 'Stock crítico',
        message: `Stock crítico: ${product.name} tiene ${product.stock} unidades (mínimo: ${product.minStock})`,
        href: '/dashboard/alerts',
      });
    }
    await broadcastSummary();
  } catch (err) {
    console.error('[alertNotifier] notifyStockChange error:', err);
  }
}

export async function notifyEntryIssue(issue: EntryIssue): Promise<void> {
  const io = getIO();
  if (!io) return;
  try {
    io.to('alerts').emit('alerts:entry_issue', issue);
    io.to('alerts').emit('alerts:toast', {
      level: 'warning',
      title: 'Incidencia en entrada',
      message: `${issue.productName}: ${issue.issueType === 'DAMAGED' ? 'producto dañado' : 'cantidad faltante'} (${issue.quantity} unidades)`,
      href: '/dashboard/alerts',
    });
  } catch (err) {
    console.error('[alertNotifier] notifyEntryIssue error:', err);
  }
}
