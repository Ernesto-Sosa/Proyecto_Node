const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database");
const Usuario = require('./Usuario');
const Inventario = require('./Inventario');
const Reparacion = require('./Reparacion');
const Vehiculo = require('./Vehiculo');
const Cita = require('./Cita');
const Inventario_Reparacion = require('./Inventario_Reparacion');

//Relacion de Uno a Muchos: un usuario puede 
// tener varios vehiculos pero un vehiculo solo 
// pertenece a un usuario.
Usuario.hasMany(Vehiculo, {
    foreignKey: 'usuario_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Vehiculo.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

//Relacion de 1 a M de Vehiculo y Usuario a Reparacion
Usuario.hasMany(Reparacion, {
    foreignKey: 'usuario_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Vehiculo.hasMany(Reparacion, {
    foreignKey: 'vehiculo_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Reparacion.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Reparacion.belongsTo(Vehiculo, {
    foreignKey: 'vehiculo_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

//Relacion de 1 a M de Usuario y Vehiculo a Cita
Usuario.hasMany(Cita, {
    foreignKey: 'usuario_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Vehiculo.hasMany(Cita, {
    foreignKey: 'vehiculo_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Cita.belongsTo(Vehiculo, {
    foreignKey: 'vehiculo_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Cita.belongsTo(Usuario, {
    foreignKey: 'vehiculo_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

//Relacion de M a M entre Inventario y Reparacion
Inventario.belongsToMany(Reparacion, {
    through: "Inventario_Reparacion",
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

module.exports = {Usuario, Inventario, Cita, Inventario_Reparacion, Reparacion, Vehiculo};