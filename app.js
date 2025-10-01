const express = require('express');
const path = require('path');

// Configuración de base de datos - IMPORTAR PRIMERO
const { testConnection } = require('./helpers/database');
const { syncDatabase } = require('./models/initModels');

// Intentar cargar middlewares opcionales
let cors, morgan;
try {
  cors = require('cors');
} catch (error) {
  console.warn('⚠️  CORS no instalado. Ejecuta: npm install cors');
}

try {
  morgan = require('morgan');
} catch (error) {
  console.warn('⚠️  Morgan no instalado. Ejecuta: npm install morgan');
}

const app = express();

// INICIO DE LA APLICACIÓN - FLUJO CORREGIDO
const startApplication = async () => {
  try {
    console.log('🚀 Iniciando aplicación...\n');

    // 1. PROBAR CONEXIÓN A LA BASE DE DATOS PRIMERO
    console.log('🔄 Conectando a la base de datos...');
    const connectionSuccess = await testConnection();
    if (!connectionSuccess) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // 2. SINCRONIZAR MODELOS Y BASE DE DATOS
    console.log('🔄 Sincronizando base de datos...');
    const syncSuccess = await syncDatabase();
    if (!syncSuccess) {
      throw new Error('No se pudo sincronizar la base de datos');
    }

    console.log(''); // Línea en blanco para separar

    // 3. CONFIGURAR MIDDLEWARES DESPUÉS DE LA BD
    if (cors) {
      app.use(cors());
    } else {
      app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
        next();
      });
    }

    if (morgan) {
      app.use(morgan('dev'));
    } else {
      app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
      });
    }

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Servir archivos estáticos
    app.use(express.static(path.join(__dirname, 'public')));

    // 4. CARGAR RUTAS DESPUÉS DE LA BD
    console.log('🔄 Cargando rutas...');
    
    // Función mejorada para cargar rutas
    const loadRoute = (routePath, routeName) => {
      try {
        const route = require(routePath);
        console.log(`✅ Ruta ${routeName} cargada: ${routePath}`);
        return route;
      } catch (error) {
        console.warn(`⚠️  Ruta ${routeName} no encontrada: ${routePath}`);
        console.log(`   Creando ruta placeholder para ${routeName}`);
        
        const router = express.Router();
        
        router.get('/', (req, res) => {
          res.status(501).json({
            success: false,
            message: `Módulo ${routeName} no implementado`,
            instruction: `Crea el archivo: ${routePath}`,
            available_operations: [
              'GET / - Listar registros',
              'POST / - Crear registro', 
              'GET /:id - Obtener por ID',
              'PUT /:id - Actualizar registro',
              'DELETE /:id - Eliminar registro'
            ]
          });
        });
        
        router.post('/', (req, res) => {
          res.status(501).json({
            success: false,
            message: `Módulo ${routeName} no implementado`,
            instruction: `Crea el archivo: ${routePath}`
          });
        });
        
        router.get('/:id', (req, res) => {
          res.status(501).json({
            success: false,
            message: `Módulo ${routeName} no implementado`,
            instruction: `Crea el archivo: ${routePath}`
          });
        });
        
        router.put('/:id', (req, res) => {
          res.status(501).json({
            success: false,
            message: `Módulo ${routeName} no implementado`,
            instruction: `Crea el archivo: ${routePath}`
          });
        });
        
        router.delete('/:id', (req, res) => {
          res.status(501).json({
            success: false,
            message: `Módulo ${routeName} no implementado`,
            instruction: `Crea el archivo: ${routePath}`
          });
        });

        return router;
      }
    };

    app.use('/api/citas', loadRoute('./routes/citaRouter', 'Citas'));
    app.use('/api/usuarios', loadRoute('./routes/usuarioRouter', 'Usuarios'));
    app.use('/api/vehiculos', loadRoute('./routes/vehiculoRouter', 'Vehículos'));
    app.use('/api/reparaciones', loadRoute('./routes/reparacionRouter', 'Reparaciones'));
    app.use('/api/inventario', loadRoute('./routes/inventarioRouter', 'Inventario'));
    console.log('✅ Todas las rutas cargadas\n');

    // 5. RUTAS DE LA API
    app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        message: 'API Taller Automotriz funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        modulos: [
          'citas', 
          'usuarios', 
          'vehiculos', 
          'reparaciones', 
          'inventario'
        ]
      });
    });

    app.get('/', (req, res) => {
      res.json({
        message: '🚗 Bienvenido a la API del Taller Automotriz',
        documentation: '/api-docs',
        health_check: '/api/health',
        endpoints: {
          citas: '/api/citas',
          usuarios: '/api/usuarios', 
          vehiculos: '/api/vehiculos',
          reparaciones: '/api/reparaciones',
          inventario: '/api/inventario'
        },
        status: 'Servidor funcionando correctamente'
      });
    });

    // 6. SWAGGER DOCUMENTATION
    try {
      const setupSwagger = require('./docs/swaggerConfig');
      setupSwagger(app);
      console.log('📚 Swagger UI disponible en: http://localhost:3000/api-docs');
      console.log('✅ Swagger configurado correctamente\n');
    } catch (error) {
      console.warn('⚠️  Swagger no configurado:', error.message);
      
      app.get('/api-docs', (req, res) => {
        res.json({
          message: 'Swagger no está configurado completamente',
          instructions: [
            '1. Verifica que la carpeta docs/swagger/ exista',
            '2. Agrega los archivos YAML de documentación',
            '3. Verifica que docs/swaggerConfig.js esté correcto'
          ],
          available_endpoints: {
            citas: 'GET/POST/PUT/DELETE /api/citas',
            usuarios: 'GET/POST/PUT/DELETE /api/usuarios',
            vehiculos: 'GET/POST/PUT/DELETE /api/vehiculos',
            reparaciones: 'GET/POST/PUT/DELETE /api/reparaciones', 
            inventario: 'GET/POST/PUT/DELETE /api/inventario',
            health: 'GET /api/health'
          }
        });
      });
    }

    // 7. MANEJO DE RUTAS NO ENCONTRADAS
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith('/api/') && !res.headersSent) {
        const path = req.originalUrl;
        const isApiRoute = 
          !path.includes('/citas') && 
          !path.includes('/usuarios') && 
          !path.includes('/vehiculos') && 
          !path.includes('/reparaciones') && 
          !path.includes('/inventario') && 
          !path.includes('/health') &&
          !path.includes('/api-docs');
        
        if (isApiRoute) {
          return res.status(404).json({
            success: false,
            message: `Endpoint de API no encontrado: ${path}`,
            available_endpoints: {
              citas: '/api/citas',
              usuarios: '/api/usuarios',
              vehiculos: '/api/vehiculos', 
              reparaciones: '/api/reparaciones',
              inventario: '/api/inventario',
              health: '/api/health',
              docs: '/api-docs'
            },
            example_usage: {
              listar_citas: 'GET /api/citas',
              crear_usuario: 'POST /api/usuarios',
              obtener_vehiculo: 'GET /api/vehiculos/1'
            }
          });
        }
      }
      next();
    });

    app.use((req, res) => {
      if (!res.headersSent && req.originalUrl !== '/' && !req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
          success: false,
          message: `Ruta no encontrada: ${req.originalUrl}`,
          available_routes: {
            home: '/',
            api_docs: '/api-docs',
            api_health: '/api/health',
            api_endpoints: '/api/*'
          }
        });
      }
    });

    // 8. MANEJO GLOBAL DE ERRORES
    app.use((error, req, res, next) => {
      console.error('❌ Error global:', error.message);
      
      if (error.code === 'MODULE_NOT_FOUND') {
        return res.status(500).json({
          success: false,
          message: 'Dependencia faltante',
          error: 'Faltan módulos necesarios',
          solution: 'Ejecuta: npm install express cors morgan swagger-jsdoc swagger-ui-express yamljs',
          missing_module: error.message.split("'")[1] || 'desconocido'
        });
      }
      
      if (error.name && error.name.includes('Sequelize')) {
        return res.status(400).json({
          success: false,
          message: 'Error de base de datos',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Error en la operación de base de datos'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Contacta al administrador del sistema'
      });
    });

    // 9. INICIAR SERVIDOR - ÚLTIMO PASO
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log('🎉 APLICACIÓN INICIADA CORRECTAMENTE');
      console.log('=' .repeat(50));
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📍 URL local: http://localhost:${PORT}`);
      console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
      console.log('');
      console.log('📋 Endpoints disponibles:');
      console.log('   📅 Citas        - http://localhost:3000/api/citas');
      console.log('   👥 Usuarios     - http://localhost:3000/api/usuarios');
      console.log('   🚗 Vehículos    - http://localhost:3000/api/vehiculos');
      console.log('   🔧 Reparaciones - http://localhost:3000/api/reparaciones');
      console.log('   📦 Inventario   - http://localhost:3000/api/inventario');
      console.log('');
      console.log('💡 Para probar la API:');
      console.log('   curl http://localhost:3000/api/health');
      console.log('   curl http://localhost:3000/api/citas');
      console.log('=' .repeat(50));
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 Apagando servidor...');
      server.close(() => {
        console.log('✅ Servidor apagado correctamente');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO - No se pudo iniciar la aplicación:');
    console.error('   ', error.message);
    console.log('\n🔧 Solución:');
    console.log('   1. Verifica que PostgreSQL esté ejecutándose');
    console.log('   2. Revisa la configuración en el archivo .env');
    console.log('   3. Asegúrate de que la base de datos exista en pgAdmin4');
    process.exit(1);
  }
};

// INICIAR LA APLICACIÓN
startApplication();

module.exports = app;