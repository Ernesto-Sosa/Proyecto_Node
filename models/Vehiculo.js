const { DataTypes } = require("sequelize");
const { sequelize } = require("../helpers/database"); // ✅ Usar { sequelize }

const Vehiculo = sequelize.define('Vehiculo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    marca: {
        type: DataTypes.STRING,
        allowNull: false
    },
    modelo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    año: {
        type: DataTypes.STRING,
        allowNull: false
    },
    placa: {
        type: DataTypes.STRING,
        allowNull: false
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: true // ✅ Agregar esto
});

module.exports = Vehiculo;