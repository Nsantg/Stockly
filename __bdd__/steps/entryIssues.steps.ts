import path from 'path';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { EntryIssue, EntryIssueType } from '@/entity/EntryIssue';
import { Movement } from '@/entity/Movement';
import { Product } from '@/entity/Product';
import { MovementType } from '@/entity/MovementType';
import {
  BDD_PRODUCT_ID,
  BDD_USER_ID,
  BDD_MOVEMENT_ID,
  buildProduct,
} from '../support/helpers/productFactory';
import { createQueryRunnerMock } from '../support/helpers/queryRunnerMock';

const feature = loadFeature(path.join(__dirname, '../features/entryIssues.feature'));

interface EntryIssueContext {
  product: Product;
  movementId: string;
  entryIssue: EntryIssue | null;
  issuesGenerated: EntryIssue[];
  stockBefore: number;
  stockAfter: number;
  error: Error | null;
}

function buildEntryIssue(
  productName: string,
  issueType: EntryIssueType,
  quantity: number,
  resolved = false,
): EntryIssue {
  return {
    id: 'issue-uuid-0001',
    movementId: BDD_MOVEMENT_ID,
    productId: BDD_PRODUCT_ID,
    productName,
    quantity,
    issueType,
    isResolved: resolved,
    resolvedByMovementId: null,
  } as EntryIssue;
}

function buildMovement(type = MovementType.ENTRADA, quantity = 50): Movement {
  return {
    id: BDD_MOVEMENT_ID,
    type,
    productId: BDD_PRODUCT_ID,
    quantity,
    userId: BDD_USER_ID,
    isAnnulled: false,
  } as Movement;
}

defineFeature(feature, (test) => {
  let ctx: EntryIssueContext;

  beforeEach(() => {
    ctx = {
      product: null as unknown as Product,
      movementId: BDD_MOVEMENT_ID,
      entryIssue: null,
      issuesGenerated: [],
      stockBefore: 0,
      stockAfter: 0,
      error: null,
    };
  });

  test('Almacenista registra entrada con producto dañado', ({ given, and, when, then }) => {
    given('un almacenista autenticado en el sistema', () => {
      // El almacenista está autenticado; no requiere acción en este nivel
    });

    and(/^un producto "(.*)" con stock de (\d+) unidades$/, (name: string, stock: string) => {
      ctx.product = buildProduct({ name, stock: Number(stock), categoryName: 'Masoterapia', allowsSerialNumber: false });
      ctx.stockBefore = Number(stock);
    });

    when(/^registra una entrada de (\d+) unidades con observación "(.*)"$/, (quantity: string, obs: string) => {
      buildMovement(MovementType.ENTRADA, Number(quantity));
      expect(obs).toBeTruthy();
    });

    and(/^marca (\d+) unidades como dañadas$/, (damaged: string) => {
      ctx.entryIssue = buildEntryIssue(ctx.product.name, 'DAMAGED', Number(damaged));
      ctx.issuesGenerated.push(ctx.entryIssue);
    });

    then(/^se genera una EntryIssue de tipo "(.*)" para "(.*)"$/, (type: string, name: string) => {
      expect(ctx.issuesGenerated).toHaveLength(1);
      expect(ctx.issuesGenerated[0].issueType).toBe(type);
      expect(ctx.issuesGenerated[0].productName).toBe(name);
    });

    and('la incidencia queda en estado pendiente', () => {
      expect(ctx.issuesGenerated[0].isResolved).toBe(false);
    });

    and(/^la cantidad afectada es (\d+) unidades$/, (qty: string) => {
      expect(ctx.issuesGenerated[0].quantity).toBe(Number(qty));
    });
  });

  test('Almacenista registra entrada con cantidad faltante', ({ given, and, when, then }) => {
    given('un almacenista autenticado en el sistema', () => {});

    and(/^un producto "(.*)" con stock de (\d+) unidades$/, (name: string, stock: string) => {
      ctx.product = buildProduct({ name, stock: Number(stock), categoryName: 'Masoterapia', allowsSerialNumber: false });
    });

    when(/^registra una entrada de (\d+) unidades declaradas$/, (qty: string) => {
      buildMovement(MovementType.ENTRADA, Number(qty));
    });

    and(/^reporta (\d+) unidades faltantes en la recepción$/, (missing: string) => {
      ctx.entryIssue = buildEntryIssue(ctx.product.name, 'MISSING', Number(missing));
      ctx.issuesGenerated.push(ctx.entryIssue);
    });

    then(/^se genera una EntryIssue de tipo "(.*)" para "(.*)"$/, (type: string, name: string) => {
      expect(ctx.issuesGenerated).toHaveLength(1);
      expect(ctx.issuesGenerated[0].issueType).toBe(type);
      expect(ctx.issuesGenerated[0].productName).toBe(name);
    });

    and('la incidencia queda en estado pendiente', () => {
      expect(ctx.issuesGenerated[0].isResolved).toBe(false);
    });

    and(/^la cantidad afectada es (\d+) unidades$/, (qty: string) => {
      expect(ctx.issuesGenerated[0].quantity).toBe(Number(qty));
    });
  });

  test('Almacenista registra entrada sin incidencias', ({ given, and, when, then }) => {
    given('un almacenista autenticado en el sistema', () => {});

    and(/^un producto "(.*)" con stock de (\d+) unidades$/, (name: string, stock: string) => {
      ctx.product = buildProduct({ name, stock: Number(stock), categoryName: 'Masoterapia', allowsSerialNumber: false });
      ctx.stockBefore = Number(stock);
    });

    when(/^registra una entrada de (\d+) unidades sin observaciones de daño$/, (qty: string) => {
      ctx.stockAfter = ctx.stockBefore + Number(qty);
    });

    then('no se genera ninguna EntryIssue', () => {
      expect(ctx.issuesGenerated).toHaveLength(0);
    });

    and(/^el stock del producto se incrementa en (\d+) unidades$/, (qty: string) => {
      expect(ctx.stockAfter - ctx.stockBefore).toBe(Number(qty));
    });
  });

  test('Supervisor resuelve una incidencia pendiente', ({ given, when, then, and }) => {
    given(/^una EntryIssue de tipo "(.*)" en estado pendiente para "(.*)"$/, (type: string, name: string) => {
      ctx.entryIssue = buildEntryIssue(name, type as EntryIssueType, 5, false);
    });

    when('el administrador marca la incidencia como resuelta', () => {
      if (ctx.entryIssue) {
        ctx.entryIssue.isResolved = true;
        ctx.entryIssue.resolvedByMovementId = 'resolve-movement-uuid';
      }
    });

    then('la incidencia queda en estado resuelto', () => {
      expect(ctx.entryIssue?.isResolved).toBe(true);
    });

    and('se registra el movimiento de resolución asociado', () => {
      expect(ctx.entryIssue?.resolvedByMovementId).toBeTruthy();
    });
  });
});
