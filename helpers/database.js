const { Sequelize } = require("sequelize");
require("dotenv").config();

const databaseName = process.env.DB_NAME || 'Taller';
const password = process.env.DB_PASSWORD || 'postgres';
const user = process.env.DB_USER || 'postgres';
const dialect = process.env.DB_DIALECT || 'postgres';
const host = process.env.DB_HOST || 'localhost';

// ✅ CREAR LA INSTANCIA DE SEQUELIZE
const sequelize = new Sequelize(databaseName, user, password, {
    host: host,
    dialect: dialect,
    port: process.env.DB_PORT || 5432,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// ✅ FUNCIÓN PARA PROBAR CONEXIÓN
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Conexión establecida correctamente con PostgreSQL.");
        return true;
    } catch (error) {
        console.error("❌ Error al conectarse a la base de datos:", error.message);
        return false;
    }
};

// ✅ EXPORTAR sequelize COMO OBJETO, NO SOLO LA INSTANCIA
module.exports = { 
    sequelize: sequelize,  // ✅ Esto es lo que necesitan los modelos
    testConnection 
};