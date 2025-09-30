// models/InventarioReparacion.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventario_Reparacion = sequelize.define('Inventario_Reparacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    reparacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'reparaciones',
            key: 'id'
        }
    },
    inventario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'inventario',
            key: 'id'
        }
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'inventario_reparacion',
    timestamps: false
});

module.exports = Inventario_Reparacion;