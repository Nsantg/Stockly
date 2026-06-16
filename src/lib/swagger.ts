import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const definition: swaggerJsdoc.OAS3Definition = {
  openapi: '3.0.0',
  info: {
    title: 'Stockly API',
    version: '1.0.0',
    description:
      'API REST del sistema de gestión de inventario Stockly para insumos médicos de fisioterapia.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Servidor local' }],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'Cookie de sesión generada por NextAuth',
      },
    },
    responses: {
      Unauthorized: {
        description: 'No autorizado — se requiere sesión activa',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
      Forbidden: {
        description: 'Acceso prohibido — rol sin permisos suficientes',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
      ValidationError: {
        description: 'Error de validación en los datos enviados',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } },
        },
      },
      InternalError: {
        description: 'Error interno del servidor',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Mensaje de error' },
          details: { type: 'string', example: 'Descripción detallada del error' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Datos inválidos' },
          details: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
            example: { name: ['El nombre es requerido'] },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nombre: { type: 'string', example: 'Santiago' },
          apellido: { type: 'string', example: 'García' },
          email: { type: 'string', format: 'email', example: 'usuario@stockly.com' },
          rol: {
            type: 'string',
            enum: ['Admin', 'Almacenista', 'Despachador', 'Visualizador'],
          },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateUserDto: {
        type: 'object',
        required: ['nombre', 'apellido', 'email', 'password'],
        properties: {
          nombre: { type: 'string', example: 'Santiago' },
          apellido: { type: 'string', example: 'García' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6, example: 'segura123' },
          rol: {
            type: 'string',
            enum: ['Admin', 'Almacenista', 'Despachador', 'Visualizador'],
            default: 'Despachador',
          },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Electroterapia' },
          requiresRefrigeration: { type: 'boolean', example: false },
          allowsSerialNumber: { type: 'boolean', example: false },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateCategoryDto: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Electroterapia' },
          requiresRefrigeration: { type: 'boolean', default: false },
          allowsSerialNumber: { type: 'boolean', default: false },
        },
      },
      Subcategory: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'TENS' },
          categoryId: { type: 'string', format: 'uuid' },
          category: { $ref: '#/components/schemas/Category' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateSubcategoryDto: {
        type: 'object',
        required: ['name', 'categoryId'],
        properties: {
          name: { type: 'string', example: 'TENS' },
          categoryId: { type: 'string', format: 'uuid' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'ELEC-001' },
          barcode: { type: 'string', nullable: true, example: '7701234567890' },
          serialNumber: { type: 'string', nullable: true, example: 'SN-2024-001' },
          name: { type: 'string', example: 'Equipo TENS Digital' },
          weight: { type: 'number', nullable: true, example: 1.5 },
          subcategoryId: { type: 'string', format: 'uuid' },
          subcategory: { $ref: '#/components/schemas/Subcategory' },
          requiresRefrigeration: { type: 'boolean', example: false },
          stock: { type: 'integer', minimum: 0, example: 10 },
          minStock: { type: 'integer', minimum: 0, example: 2 },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateProductDto: {
        type: 'object',
        required: ['code', 'name', 'subcategoryId'],
        properties: {
          code: { type: 'string', example: 'ELEC-001' },
          name: { type: 'string', example: 'Equipo TENS Digital' },
          subcategoryId: { type: 'string', format: 'uuid' },
          barcode: { type: 'string', nullable: true },
          serialNumber: { type: 'string', nullable: true },
          weight: { type: 'number', nullable: true, example: 1.5 },
          requiresRefrigeration: { type: 'boolean', default: false },
          stock: { type: 'integer', minimum: 0, default: 0 },
          minStock: { type: 'integer', minimum: 0, default: 0 },
        },
      },
      ProductAutocomplete: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'ELEC-001' },
          name: { type: 'string', example: 'Equipo TENS Digital' },
        },
      },
      InventorySummary: {
        type: 'object',
        properties: {
          totalProducts: { type: 'integer', example: 120 },
          totalStock: { type: 'integer', example: 3450 },
          lowStockCount: { type: 'integer', example: 5 },
        },
      },
      Lot: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          lotNumber: { type: 'string', example: 'LOT-2024-001' },
          expirationDate: { type: 'string', format: 'date', nullable: true, example: '2025-12-31' },
          stock: { type: 'integer', minimum: 0, example: 50 },
          productId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedProducts: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
          total: { type: 'integer', example: 50 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
        },
      },
      ClientType: {
        type: 'string',
        enum: ['Detal', 'Mayorista'],
        example: 'Detal',
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'María Gómez' },
          phone: { type: 'string', nullable: true, example: '3001234567' },
          address: { type: 'string', nullable: true, example: 'Calle 10 # 5-20' },
          city: { type: 'string', nullable: true, example: 'Bogotá' },
          email: { type: 'string', format: 'email', nullable: true, example: 'maria@example.com' },
          clientType: { $ref: '#/components/schemas/ClientType' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateClientDto: {
        type: 'object',
        required: ['name', 'clientType'],
        properties: {
          name: { type: 'string', minLength: 2, example: 'María Gómez' },
          clientType: { $ref: '#/components/schemas/ClientType' },
          phone: { type: 'string', example: '3001234567' },
          address: { type: 'string', example: 'Calle 10 # 5-20' },
          city: { type: 'string', example: 'Bogotá' },
          email: { type: 'string', format: 'email', example: 'maria@example.com' },
        },
      },
      ClientAutocomplete: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'María Gómez' },
          clientType: { $ref: '#/components/schemas/ClientType' },
        },
      },
      MovementType: {
        type: 'string',
        enum: [
          'ENTRADA',
          'VENTA',
          'DAÑO',
          'VENCIMIENTO',
          'DEVOLUCION',
          'AJUSTE_INGRESO',
          'AJUSTE_SALIDA',
          'TRASLADO',
        ],
        example: 'ENTRADA',
      },
      LocationType: {
        type: 'string',
        enum: ['BODEGA', 'VITRINA'],
        example: 'BODEGA',
      },
      Movement: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { $ref: '#/components/schemas/MovementType' },
          productId: { type: 'string', format: 'uuid' },
          product: { $ref: '#/components/schemas/Product' },
          quantity: { type: 'integer', minimum: 1, example: 10 },
          userId: { type: 'string', format: 'uuid' },
          user: { $ref: '#/components/schemas/User' },
          date: { type: 'string', format: 'date-time' },
          observations: { type: 'string', nullable: true, example: 'Producto recibido en buen estado' },
          isAnnulled: { type: 'boolean', example: false },
          annulledAt: { type: 'string', format: 'date-time', nullable: true },
          annulledById: { type: 'string', format: 'uuid', nullable: true },
          annulledReason: { type: 'string', nullable: true },
          clientId: { type: 'string', format: 'uuid', nullable: true },
          client: { $ref: '#/components/schemas/Client' },
          clientType: { allOf: [{ $ref: '#/components/schemas/ClientType' }], nullable: true },
          totalWeight: { type: 'number', nullable: true, example: 12.5 },
          returnCause: { type: 'string', nullable: true, example: 'Falla de fábrica' },
          returnDescription: { type: 'string', nullable: true },
          sourceLocation: { allOf: [{ $ref: '#/components/schemas/LocationType' }], nullable: true },
          targetLocation: { allOf: [{ $ref: '#/components/schemas/LocationType' }], nullable: true },
          evidenceUrls: {
            type: 'array',
            nullable: true,
            items: { type: 'string', format: 'uri' },
            maxItems: 4,
            description: 'URLs de evidencia fotográfica en Cloudinary (máx. 4). Solo aplica para movimientos de tipo salida',
            example: ['https://res.cloudinary.com/stockly/image/upload/stockly/movements/abc123.jpg'],
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateMovementDto: {
        type: 'object',
        required: ['type', 'productId', 'quantity', 'userId'],
        properties: {
          type: { $ref: '#/components/schemas/MovementType' },
          productId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1, example: 10 },
          userId: { type: 'string', format: 'uuid' },
          observations: { type: 'string', example: 'Motivo del movimiento' },
          clientId: { type: 'string', format: 'uuid' },
          clientType: { $ref: '#/components/schemas/ClientType' },
          totalWeight: { type: 'number', example: 12.5 },
          returnCause: { type: 'string', example: 'Falla de fábrica' },
          returnDescription: { type: 'string' },
        },
      },
      AnnulMovementDto: {
        type: 'object',
        required: ['reason', 'userId'],
        properties: {
          reason: { type: 'string', minLength: 5, example: 'Registro duplicado por error' },
          userId: { type: 'string', format: 'uuid' },
        },
      },
      EditDispatchDto: {
        type: 'object',
        properties: {
          productId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1, example: 5 },
          clientId: { type: 'string', format: 'uuid' },
          clientType: { $ref: '#/components/schemas/ClientType' },
          totalWeight: { type: 'number', example: 8.0 },
        },
      },
      StockAlert: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['STOCK_CRITICAL'], example: 'STOCK_CRITICAL' },
          productId: { type: 'string', format: 'uuid' },
          productName: { type: 'string', example: 'Jeringas 5ml' },
          stock: { type: 'integer', example: 5 },
          minStock: { type: 'integer', example: 20 },
          message: { type: 'string', example: 'Stock crítico: Jeringas 5ml tiene 5 unidades (mínimo: 20)' },
          level: { type: 'string', enum: ['CRITICAL'], example: 'CRITICAL' },
        },
      },
      ExpirationAlert: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['EXPIRATION_WARNING'], example: 'EXPIRATION_WARNING' },
          lotId: { type: 'string', format: 'uuid' },
          lotNumber: { type: 'string', example: 'LOT-2024-001' },
          productId: { type: 'string', format: 'uuid' },
          productName: { type: 'string', example: 'Solución Salina' },
          expirationDate: { type: 'string', format: 'date-time' },
          daysUntilExpiration: { type: 'integer', example: 5 },
          stock: { type: 'integer', example: 200 },
          level: { type: 'string', enum: ['WARNING', 'CRITICAL'], example: 'WARNING' },
        },
      },
      AlertSummary: {
        type: 'object',
        properties: {
          stockAlerts: {
            type: 'array',
            items: { $ref: '#/components/schemas/StockAlert' },
          },
          expirationAlerts: {
            type: 'array',
            items: { $ref: '#/components/schemas/ExpirationAlert' },
          },
          totalCritical: { type: 'integer', example: 3 },
          totalWarnings: { type: 'integer', example: 5 },
        },
      },
      Settings: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          generalMinStock: { type: 'integer', minimum: 0, example: 20 },
          expirationAlertDays: { type: 'integer', enum: [7, 15, 30, 60], example: 7 },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DashboardKpis: {
        type: 'object',
        properties: {
          dispatchedUnits: { type: 'integer', example: 450 },
          dispatchCount: { type: 'integer', example: 38 },
          entryCount: { type: 'integer', example: 12 },
          topClient: {
            nullable: true,
            type: 'object',
            properties: {
              clientId: { type: 'string', format: 'uuid' },
              clientName: { type: 'string', example: 'María Gómez' },
              totalPurchases: { type: 'integer', example: 120 },
            },
          },
          maxStockProduct: {
            nullable: true,
            type: 'object',
            properties: {
              productId: { type: 'string', format: 'uuid' },
              productName: { type: 'string', example: 'Gasas Estériles' },
              stock: { type: 'integer', example: 500 },
            },
          },
          minStockProduct: {
            nullable: true,
            type: 'object',
            properties: {
              productId: { type: 'string', format: 'uuid' },
              productName: { type: 'string', example: 'Jeringas 5ml' },
              stock: { type: 'integer', example: 2 },
            },
          },
          stockPercentage: { type: 'number', example: 87.5 },
          topRotationProduct: {
            nullable: true,
            type: 'object',
            properties: {
              productId: { type: 'string', format: 'uuid' },
              productName: { type: 'string', example: 'Solución Salina' },
              totalDispatched: { type: 'integer', example: 200 },
            },
          },
          rotationIndex: { type: 'number', example: 1.85 },
          damagedIndex: { type: 'number', example: 3.2 },
          discardRate: { type: 'number', example: 0.75 },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
};

const options: swaggerJsdoc.Options = {
  definition,
  apis: [path.join(process.cwd(), 'src/controller/*.ts')],
};

let cachedSpec: object | null = null;

export function getSwaggerSpec(): object {
  if (cachedSpec) return cachedSpec;
  cachedSpec = swaggerJsdoc(options);
  return cachedSpec;
}
