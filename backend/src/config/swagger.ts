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
        // ========== PROVEEDOR ==========
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
        // ========== SOLICITUD ==========
        Solicitud: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            numero: { type: 'string' },
            tipo: { type: 'string', enum: ['cotizacion', 'precios_bienes'] },
            departamento_id: { type: 'integer' },
            empleado_dni: { type: 'string' },
            observaciones: { type: 'string' },
            estado: { type: 'string', enum: ['pendiente', 'respondida', 'cancelada'] },
            fecha_solicitud: { type: 'string', format: 'date-time' },
            fecha_respuesta: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        // ========== REQUISICIÓN ==========
        Requisicion: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            numero: { type: 'string' },
            tipo: { type: 'string', enum: ['compras', 'bienes'] },
            departamento_id: { type: 'integer' },
            empleado_dni: { type: 'string' },
            dirigida_a: { type: 'string', enum: ['compras', 'bienes'] },
            solicitud_id: { type: 'integer', nullable: true },
            proveedor_id: { type: 'integer', nullable: true },
            proveedor_nombre_snap: { type: 'string', nullable: true },
            rtn_proveedor_snap: { type: 'string', nullable: true },
            codigo_presupuestario: { type: 'string', nullable: true },
            expediente: { type: 'string', nullable: true },
            subtotal: { type: 'number' },
            total_isv: { type: 'number' },
            total: { type: 'number' },
            estado: { type: 'string', enum: ['borrador','pendiente','aprobada','rechazada','comprometida','anulada'] },
            aprobado_por: { type: 'string', enum: ['gerencia','alcaldia'], nullable: true },
            aprobado_por_dni: { type: 'string', nullable: true },
            motivo_rechazo: { type: 'string', nullable: true },
            observaciones: { type: 'string', nullable: true },
            fecha_creacion: { type: 'string', format: 'date-time' },
            fecha_aprobacion: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        // ========== ORDEN DE COMPRA ==========
        OrdenCompra: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            numero: { type: 'string' },
            origen_oc: { type: 'string', enum: ['desde_requisicion', 'transcripcion'] },
            requisicion_id: { type: 'integer', nullable: true },
            proveedor_id: { type: 'integer' },
            departamento_id: { type: 'integer' },
            empleado_dni: { type: 'string' },
            subtotal: { type: 'number' },
            descuento: { type: 'number' },
            impuesto: { type: 'number' },
            total: { type: 'number' },
            estado: { type: 'string', enum: ['emitida', 'entregada', 'cancelada'] },
            codigo_presupuestario: { type: 'string', nullable: true },
            expediente: { type: 'string', nullable: true },
            notas: { type: 'string', nullable: true },
            snap_jefe_compras: { type: 'string', nullable: true },
            snap_gerente: { type: 'string', nullable: true },
            snap_alcalde: { type: 'string', nullable: true },
            creado_por_dni: { type: 'string' },
            fecha_emision: { type: 'string', format: 'date-time' },
            fecha_entrega: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        // ========== ERROR ==========
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
  apis: ['./src/routes/*.ts'], // Lee anotaciones de todas las rutas
};

export const specs = swaggerJsdoc(options);