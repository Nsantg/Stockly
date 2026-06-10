import { z } from 'zod';
import { getDataSource } from '../lib/database';
import { Movement } from '../entity/Movement';
import { Product } from '../entity/Product';
import { MovementType } from '../entity/MovementType';
import { ClientType } from '../entity/ClientType';
import {
  movementRepository,
  MovementFilters,
  PaginatedMovements,
} from '../repository/MovementRepository';
import { productRepository } from '../repository/ProductRepository';
import { MovementFactory } from './movement/MovementFactory';
import { uploadImage } from '../lib/cloudinary';

const ADJUSTMENT_TYPES: MovementType[] = [MovementType.AJUSTE_INGRESO, MovementType.AJUSTE_SALIDA];

const createMovementSchema = z
  .object({
    type: z.nativeEnum(MovementType),
    productId: z.string().uuid('El productId debe ser un UUID válido').optional(),
    sourceMovementId: z.string().uuid('El sourceMovementId debe ser un UUID válido').optional(),
    quantity: z.number().int().positive('La cantidad debe ser un entero positivo'),
    userId: z.string().uuid('El userId debe ser un UUID válido'),
    observations: z.string().trim().optional(),
    clientId: z.string().uuid('El clientId debe ser un UUID válido').optional(),
    clientType: z.nativeEnum(ClientType).optional(),
    totalWeight: z.number().positive('El peso total debe ser positivo').optional(),
    returnCause: z.string().trim().optional(),
    returnDescription: z.string().trim().optional(),
    lotNumber: z.string().trim().optional().nullable(),
    expirationDate: z.string().optional().nullable(),
  })
  .refine(
    (data) =>
      ADJUSTMENT_TYPES.includes(data.type) ? !!data.sourceMovementId : !!data.productId,
    (data) =>
      ADJUSTMENT_TYPES.includes(data.type)
        ? { message: 'sourceMovementId es requerido para ajustes de inventario', path: ['sourceMovementId'] }
        : { message: 'productId es requerido para este tipo de movimiento', path: ['productId'] },
  );

const annulMovementSchema = z.object({
  reason: z.string().trim().min(5, 'El motivo debe tener al menos 5 caracteres'),
  userId: z.string().uuid('El userId debe ser un UUID válido'),
});

const editDispatchSchema = z.object({
  productId: z.string().uuid('El productId debe ser un UUID válido').optional(),
  quantity: z.number().int().positive('La cantidad debe ser un entero positivo').optional(),
  clientId: z.string().uuid('El clientId debe ser un UUID válido').optional(),
  clientType: z.nativeEnum(ClientType).optional(),
  totalWeight: z.number().positive('El peso total debe ser positivo').optional(),
});

export type CreateMovementDto = z.infer<typeof createMovementSchema>;
export type AnnulMovementDto = z.infer<typeof annulMovementSchema>;
export type EditDispatchDto = z.infer<typeof editDispatchSchema>;

type Shift = 'MAÑANA' | 'TARDE' | null;

const SALIDA_TYPES: MovementType[] = [
  MovementType.VENTA,
  MovementType.DAÑO,
  MovementType.VENCIMIENTO,
  MovementType.AJUSTE_SALIDA,
];

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_EVIDENCE_IMAGES = 4;

const STOCK_DIRECTION: Record<MovementType, number> = {
  [MovementType.ENTRADA]: 1,
  [MovementType.VENTA]: -1,
  [MovementType.DAÑO]: -1,
  [MovementType.VENCIMIENTO]: -1,
  [MovementType.DEVOLUCION]: 1,
  [MovementType.AJUSTE_INGRESO]: 1,
  [MovementType.AJUSTE_SALIDA]: -1,
  [MovementType.TRASLADO]: 0,
};

class MovementService {
  async createMovement(
    dto: CreateMovementDto,
  ): Promise<{ movement: Movement; warning: string | null }> {
    const data = createMovementSchema.parse(dto);

    if (ADJUSTMENT_TYPES.includes(data.type)) {
      const sourceMovement = await movementRepository.findById(data.sourceMovementId!);
      if (!sourceMovement) throw new Error('Movimiento fuente no encontrado');
      if (sourceMovement.isAnnulled) throw new Error('El movimiento fuente ya fue anulado');
      if (data.type === MovementType.AJUSTE_INGRESO && sourceMovement.type !== MovementType.ENTRADA) {
        throw new Error('El ajuste de ingreso requiere un movimiento de tipo ENTRADA como fuente');
      }
      if (data.type === MovementType.AJUSTE_SALIDA && sourceMovement.type !== MovementType.VENTA) {
        throw new Error('El ajuste de salida requiere un movimiento de tipo VENTA como fuente');
      }
      data.productId = sourceMovement.productId;
    }

    const product = await productRepository.findById(data.productId!);
    if (!product) {
      throw new Error('Producto no encontrado o inactivo');
    }

    const handler = MovementFactory.getHandler(data.type);
    await handler.validate(data, product);

    const dataSource = await getDataSource();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const created = await handler.execute(data, product, queryRunner);
      await queryRunner.commitTransaction();
      const movement = await this.getMovementById(created.id);
      const warning = product.requiresRefrigeration
        ? 'Este producto requiere refrigeración. Verifique que se mantenga la cadena de frío.'
        : null;
      return { movement, warning };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async annulMovement(id: string, dto: AnnulMovementDto): Promise<Movement> {
    const movement = await movementRepository.findById(id);
    if (!movement) {
      throw new Error('Movimiento no encontrado');
    }
    if (movement.isAnnulled) {
      throw new Error('Este movimiento ya fue anulado');
    }

    const data = annulMovementSchema.parse(dto);
    const reversalDelta = -STOCK_DIRECTION[movement.type] * movement.quantity;

    const dataSource = await getDataSource();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: movement.productId },
      });
      if (product) {
        if (reversalDelta !== 0) {
          product.stock += reversalDelta;
        }

        const qty = movement.quantity;
        const type = movement.type;
        if (type === MovementType.TRASLADO) {
          product.stockBodega += qty;
          product.stockVitrina = Math.max(0, product.stockVitrina - qty);
        } else if (
          type === MovementType.ENTRADA ||
          type === MovementType.DEVOLUCION ||
          type === MovementType.AJUSTE_INGRESO
        ) {
          product.stockBodega = Math.max(0, product.stockBodega - qty);
        } else {
          // VENTA, DAÑO, VENCIMIENTO, AJUSTE_SALIDA — devolver a bodega
          product.stockBodega += qty;
        }

        await queryRunner.manager.save(Product, product);
      }

      await queryRunner.manager.update(Movement, movement.id, {
        isAnnulled: true,
        annulledAt: new Date(),
        annulledById: data.userId,
        annulledReason: data.reason,
      });

      await queryRunner.commitTransaction();
      return this.getMovementById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async editDispatch(
    id: string,
    dto: EditDispatchDto,
    requestingUserId: string,
  ): Promise<Movement> {
    const movement = await movementRepository.findById(id);
    if (!movement) {
      throw new Error('Movimiento no encontrado');
    }
    if (movement.type !== MovementType.VENTA) {
      throw new Error('Solo se pueden editar despachos de tipo venta');
    }
    if (movement.isAnnulled) {
      throw new Error('No se puede editar un despacho anulado');
    }

    const data = editDispatchSchema.parse(dto);
    this.assertSameShift(movement.date);

    const targetProductId = data.productId ?? movement.productId;
    const targetQuantity = data.quantity ?? movement.quantity;

    const dataSource = await getDataSource();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (targetProductId === movement.productId) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: targetProductId },
        });
        if (!product) {
          throw new Error('Producto no encontrado');
        }
        const projected = product.stock + movement.quantity - targetQuantity;
        if (projected < 0) {
          throw new Error(
            `Stock insuficiente para "${product.name}": disponible ${product.stock}, requerido ${targetQuantity}`,
          );
        }
        const subDelta = targetQuantity - movement.quantity;
        product.stock = projected;
        if (subDelta > 0) {
          const fromVitrina = Math.min(product.stockVitrina, subDelta);
          product.stockVitrina -= fromVitrina;
          product.stockBodega -= subDelta - fromVitrina;
        } else if (subDelta < 0) {
          product.stockBodega += Math.abs(subDelta);
        }
        await queryRunner.manager.save(Product, product);
      } else {
        const oldProduct = await queryRunner.manager.findOne(Product, {
          where: { id: movement.productId },
        });
        if (oldProduct) {
          oldProduct.stock += movement.quantity;
          await queryRunner.manager.save(Product, oldProduct);
        }
        const newProduct = await queryRunner.manager.findOne(Product, {
          where: { id: targetProductId },
        });
        if (!newProduct) {
          throw new Error('Producto no encontrado');
        }
        if (newProduct.stock < targetQuantity) {
          throw new Error(
            `Stock insuficiente para "${newProduct.name}": disponible ${newProduct.stock}, requerido ${targetQuantity}`,
          );
        }
        newProduct.stock -= targetQuantity;
        await queryRunner.manager.save(Product, newProduct);
      }

      movement.productId = targetProductId;
      movement.quantity = targetQuantity;
      if (data.clientId !== undefined) {
        movement.clientId = data.clientId;
      }
      if (data.clientType !== undefined) {
        movement.clientType = data.clientType;
      }
      if (data.totalWeight !== undefined) {
        movement.totalWeight = data.totalWeight;
      }
      movement.observations = `Editado por ${requestingUserId} en ${new Date().toISOString()}`;
      await queryRunner.manager.save(Movement, movement);

      await queryRunner.commitTransaction();
      return this.getMovementById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  getMovements(filters: MovementFilters): Promise<PaginatedMovements> {
    return movementRepository.findAll(filters);
  }

  async getMovementById(id: string): Promise<Movement> {
    const movement = await movementRepository.findById(id);
    if (!movement) {
      throw new Error('Movimiento no encontrado');
    }
    return movement;
  }

  getMovementsByProduct(productId: string): Promise<Movement[]> {
    return movementRepository.findByProductId(productId);
  }

  getMovementsByUser(userId: string): Promise<Movement[]> {
    return movementRepository.findByUserId(userId);
  }

  async uploadEvidence(id: string, fileBuffer: Buffer, mimetype: string): Promise<Movement> {
    const movement = await this.getMovementById(id);

    if (!SALIDA_TYPES.includes(movement.type)) {
      throw new Error('La evidencia fotográfica solo aplica para movimientos de tipo salida');
    }

    if (movement.isAnnulled) {
      throw new Error('No se puede agregar evidencia a un movimiento anulado');
    }

    if (!ALLOWED_MIMETYPES.includes(mimetype)) {
      throw new Error('Formato de imagen no permitido. Use JPEG, PNG o WebP');
    }

    const current = movement.evidenceUrls ?? [];
    if (current.length >= MAX_EVIDENCE_IMAGES) {
      throw new Error(`No se pueden agregar más de ${MAX_EVIDENCE_IMAGES} imágenes por movimiento`);
    }

    const url = await uploadImage(fileBuffer, 'stockly/movements');
    movement.evidenceUrls = [...current, url];
    await movementRepository.save(movement);
    return this.getMovementById(id);
  }

  private getShift(date: Date): Shift {
    const hour = date.getHours();
    if (hour >= 7 && hour < 14) {
      return 'MAÑANA';
    }
    if (hour >= 14 && hour < 17) {
      return 'TARDE';
    }
    return null;
  }

  private assertSameShift(createdAt: Date): void {
    const created = this.getShift(createdAt);
    const current = this.getShift(new Date());
    if (created === null || current === null || created !== current) {
      throw new Error(
        'Solo se puede editar un despacho dentro del mismo turno en que fue registrado',
      );
    }
  }
}

export const movementService = new MovementService();
