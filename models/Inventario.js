const { DataTypes } = require("sequelize");
const { sequelize } = require("../helpers/database"); // ✅ Usar { sequelize }

const Inventario = sequelize.define('Inventario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING,
        allowNull: false
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    timestamps: true // ✅ Agregar esto
});

module.exports = Inventario;