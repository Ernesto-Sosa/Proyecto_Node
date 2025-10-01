const Usuario = require('./Usuario');
const Inventario = require('./Inventario');
const Reparacion = require('./Reparacion');
const Vehiculo = require('./Vehiculo');
const Cita = require('./Cita');
const Inventario_Reparacion = require('./Inventario_Reparacion');

// Relación de Uno a Muchos: Usuario -> Vehículos
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

// Relación de 1 a M: Usuario y Vehículo -> Reparaciones
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

// Relación de 1 a M: Usuario y Vehículo -> Citas
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
    foreignKey: 'usuario_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

// Relación de M a M entre Inventario y Reparación
Inventario.belongsToMany(Reparacion, {
    through: Inventario_Reparacion, 
    foreignKey: 'inventario_id',
    otherKey: 'reparacion_id'
});

Reparacion.belongsToMany(Inventario, {
    through: Inventario_Reparacion, 
    foreignKey: 'reparacion_id',
    otherKey: 'inventario_id'
});

module.exports = {
    Usuario, 
    Inventario, 
    Cita, 
    Inventario_Reparacion, 
    Reparacion, 
    Vehiculo
};