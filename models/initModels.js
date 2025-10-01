const { sequelize } = require('../helpers/database');

const initModels = async () => {
    try {
        console.log('🔄 Inicializando modelos...');
        
        
        const Usuario = require('./Usuario');
        const Inventario = require('./Inventario');
        const Reparacion = require('./Reparacion');
        const Vehiculo = require('./Vehiculo');
        const Cita = require('./Cita');
        const Inventario_Reparacion = require('./Inventario_Reparacion');

        
        require('./index');

        
        const models = [Usuario, Inventario, Reparacion, Vehiculo, Cita, Inventario_Reparacion];
        models.forEach(model => {
            if (model && model.name) {
                console.log(`✅ Modelo cargado: ${model.name}`);
            }
        });

        return true;
    } catch (error) {
        console.error('❌ Error inicializando modelos:', error.message);
        return false;
    }
};

const syncDatabase = async () => {
    try {
        // Inicializar modelos primero
        const modelsInitialized = await initModels();
        if (!modelsInitialized) {
            throw new Error('No se pudieron inicializar los modelos');
        }
        
        console.log('🔄 Sincronizando tablas con la base de datos...');
        
        // Sincronizar todos los modelos
        await sequelize.sync({ force: false });
        
        console.log("✅ Base de datos y tablas sincronizadas correctamente.");
        
        // Mostrar tablas creadas
        try {
            const result = await sequelize.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            `);
            
            console.log('📊 Tablas creadas en la base de datos:');
            result[0].forEach(table => {
                console.log(`   - ${table.table_name}`);
            });
        } catch (queryError) {
            console.log('📊 Tablas creadas (no se pudieron listar detalles)');
        }
        
        return true;
    } catch (error) {
        console.error("❌ Error al sincronizar la base de datos:", error.message);
        return false;
    }
};

module.exports = { initModels, syncDatabase };