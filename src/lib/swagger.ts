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
