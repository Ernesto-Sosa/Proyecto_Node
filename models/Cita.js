const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database");

const Cita = sequelize.define('Cita', {
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false
    },
    hora: {
        type: DataTypes.TIME,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    vehiculo_id: {
        type:DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Cita;