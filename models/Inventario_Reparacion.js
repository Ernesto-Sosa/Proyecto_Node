const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database");

const Inventario_Reparacion = sequelize.define('Inventario_Reparacion', {
    inventario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reparacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
})

module.exports = Inventario_Reparacion;