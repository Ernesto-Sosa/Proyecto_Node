const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Cargar configuración base
const swaggerBase = YAML.load(path.join(__dirname, 'swagger/swagger.yaml'));

// Cargar TODOS los módulos
const citasDocs = YAML.load(path.join(__dirname, 'swagger/cita.yaml'));
const usuariosDocs = YAML.load(path.join(__dirname, 'swagger/usuario.yaml'));
const vehiculosDocs = YAML.load(path.join(__dirname, 'swagger/vehiculo.yaml'));
const inventarioDocs = YAML.load(path.join(__dirname, 'swagger/inventario.yaml'));
const reparacionesDocs = YAML.load(path.join(__dirname, 'swagger/reparacion.yaml'));

// Combinar TODA la documentación
const combinedDocs = {
  ...swaggerBase,
  paths: {
    ...citasDocs.paths,
    ...usuariosDocs.paths,
    ...vehiculosDocs.paths,
    ...inventarioDocs.paths,
    ...reparacionesDocs.paths,
  },
  components: {
    ...swaggerBase.components,
    schemas: {
      ...citasDocs.components?.schemas,
      ...usuariosDocs.components?.schemas,
      ...vehiculosDocs.components?.schemas,
      ...inventarioDocs.components?.schemas,
      ...reparacionesDocs.components?.schemas,
    },
    securitySchemes: {
      ...usuariosDocs.components?.securitySchemes,
    }
  },
  tags: [
    ...(citasDocs.tags || []),
    ...(usuariosDocs.tags || []),
    ...(vehiculosDocs.tags || []),
    ...(inventarioDocs.tags || []),
    ...(reparacionesDocs.tags || []),
  ]
};

// Configuración de Swagger JSdoc
const options = {
  swaggerDefinition: combinedDocs,
  apis: [], // No necesitamos escanear archivos porque usamos YAML
};

const specs = swaggerJsdoc(options);

// Middleware de configuración de Swagger UI
module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c3e50; }
      .swagger-ui .scheme-container { background: #f8f9fa; }
      .swagger-ui .btn.authorize { background: #2c5aa0; }
    `,
    customSiteTitle: 'API Taller Automotriz - Documentación Completa',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    }
  }));
  
  console.log('📚 Swagger UI disponible en: http://localhost:3000/api-docs');
  console.log('✅ Todos los módulos documentados: Citas, Usuarios, Vehículos, Inventario, Reparaciones');
};