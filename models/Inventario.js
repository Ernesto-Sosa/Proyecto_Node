const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database");

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
        type: DataTypes.STRING,
        allowNull:false
    },
    stock: {
        type: DataTypes.STRING,
        allowNull: false
    },

})

module.exports = Inventario;