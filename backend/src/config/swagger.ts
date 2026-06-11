import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Municipalidad de Danlí - Sistema de Requisiciones',
      version: '1.0.0',
      description: 'Backend para gestión de solicitudes, requisiciones y órdenes de compra',
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Proveedor: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            rtn: { type: 'string' },
            direccion: { type: 'string', nullable: true },
            correo: { type: 'string', nullable: true },
            telefono: { type: 'string', nullable: true },
            activo: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'], // Lee las anotaciones de las rutas
};

export const specs = swaggerJsdoc(options);