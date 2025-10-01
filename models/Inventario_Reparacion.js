const { DataTypes } = require("sequelize");
const { sequelize } = require("../helpers/database"); // ✅ Usar { sequelize }

const Inventario_Reparacion = sequelize.define('Inventario_Reparacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    reparacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    inventario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    timestamps: true // ✅ Agregar esto
});

module.exports = Inventario_Reparacion;