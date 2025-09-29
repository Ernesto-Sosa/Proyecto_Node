const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database");

const Reparacion = sequelize.define('Reparacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    costo: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    vehiculo_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Reparacion;