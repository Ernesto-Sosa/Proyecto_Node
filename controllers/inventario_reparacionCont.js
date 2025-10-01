// controllers/inventarioReparacionController.js
const { Inventario_Reparacion, Reparacion, Inventario } = require('../models');
const { Op } = require('sequelize');

// @desc    Agregar item de inventario a una reparación
// @route   POST /api/reparaciones/:reparacionId/inventario
// @access  Privado
const agregarItemAReparacion = async (req, res) => {
    try {
        const { reparacionId } = req.params;
        const { inventario_id, cantidad, precio_unitario } = req.body;

        // Validaciones básicas
        if (!inventario_id || !cantidad || !precio_unitario) {
            return res.status(400).json({
                success: false,
                message: 'inventario_id, cantidad y precio_unitario son campos requeridos'
            });
        }

        // Verificar que la reparación existe
        const reparacion = await Reparacion.findByPk(reparacionId);
        if (!reparacion) {
            return res.status(404).json({
                success: false,
                message: 'Reparación no encontrada'
            });
        }

        // Verificar que el item de inventario existe
        const itemInventario = await Inventario.findByPk(inventario_id);
        if (!itemInventario) {
            return res.status(404).json({
                success: false,
                message: 'Item de inventario no encontrado'
            });
        }

        // Verificar stock disponible
        if (itemInventario.stock < cantidad) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente. Disponible: ${itemInventario.stock}, Solicitado: ${cantidad}`
            });
        }

        // Verificar si ya existe esta relación
        const relacionExistente = await Inventario_Reparacion.findOne({
            where: {
                reparacion_id: reparacionId,
                inventario_id: inventario_id
            }
        });

        if (relacionExistente) {
            return res.status(400).json({
                success: false,
                message: 'Este item ya está asociado a la reparación'
            });
        }

        // Crear la relación
        const nuevaRelacion = await Inventario_Reparacion.create({
            reparacion_id: reparacionId,
            inventario_id: inventario_id,
            cantidad: parseInt(cantidad),
            precio_unitario: parseFloat(precio_unitario)
        });

        // Actualizar stock del inventario
        await itemInventario.decrement('stock', { by: cantidad });

        // Cargar relaciones para la respuesta
        const relacionCompleta = await Inventario_Reparacion.findByPk(nuevaRelacion.id, {
            include: [
                {
                    association: 'inventario',
                    attributes: ['id', 'nombre', 'descripcion', 'categoria']
                },
                {
                    association: 'reparacion',
                    attributes: ['id', 'descripcion', 'estado']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Item agregado a la reparación exitosamente',
            data: relacionCompleta
        });

    } catch (error) {
        console.error('Error al agregar item a reparación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener items de inventario de una reparación
// @route   GET /api/reparaciones/:reparacionId/inventario
// @access  Privado
const obtenerItemsDeReparacion = async (req, res) => {
    try {
        const { reparacionId } = req.params;

        // Verificar que la reparación existe
        const reparacion = await Reparacion.findByPk(reparacionId);
        if (!reparacion) {
            return res.status(404).json({
                success: false,
                message: 'Reparación no encontrada'
            });
        }

        const itemsReparacion = await Inventario_Reparacion.findAll({
            where: { reparacion_id: reparacionId },
            include: [
                {
                    association: 'inventario',
                    attributes: ['id', 'nombre', 'descripcion', 'categoria']
                }
            ],
            order: [['id', 'ASC']]
        });

        // Calcular total de repuestos
        const totalRepuestos = itemsReparacion.reduce((total, item) => {
            return total + (item.cantidad * item.precio_unitario);
        }, 0);

        res.json({
            success: true,
            data: itemsReparacion,
            total_repuestos: totalRepuestos,
            total_items: itemsReparacion.length
        });

    } catch (error) {
        console.error('Error al obtener items de reparación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Actualizar item en una reparación
// @route   PUT /api/reparaciones/:reparacionId/inventario/:itemId
// @access  Privado
const actualizarItemEnReparacion = async (req, res) => {
    try {
        const { reparacionId, itemId } = req.params;
        const { cantidad, precio_unitario } = req.body;

        // Buscar la relación
        const relacion = await Inventario_Reparacion.findOne({
            where: {
                id: itemId,
                reparacion_id: reparacionId
            },
            include: ['inventario']
        });

        if (!relacion) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en esta reparación'
            });
        }

        const camposActualizar = {};
        let diferenciaStock = 0;

        // Manejar actualización de cantidad
        if (cantidad !== undefined) {
            const nuevaCantidad = parseInt(cantidad);
            if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser un número válido mayor a 0'
                });
            }

            diferenciaStock = nuevaCantidad - relacion.cantidad;
            camposActualizar.cantidad = nuevaCantidad;

            // Verificar stock disponible si se aumenta la cantidad
            if (diferenciaStock > 0 && relacion.inventario.stock < diferenciaStock) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente. Disponible: ${relacion.inventario.stock}, Necesario: ${diferenciaStock}`
                });
            }
        }

        // Manejar actualización de precio
        if (precio_unitario !== undefined) {
            const nuevoPrecio = parseFloat(precio_unitario);
            if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio unitario debe ser un número válido mayor o igual a 0'
                });
            }
            camposActualizar.precio_unitario = nuevoPrecio;
        }

        // Actualizar la relación
        await relacion.update(camposActualizar);

        // Actualizar stock si la cantidad cambió
        if (diferenciaStock !== 0) {
            if (diferenciaStock > 0) {
                await relacion.inventario.decrement('stock', { by: diferenciaStock });
            } else {
                await relacion.inventario.increment('stock', { by: Math.abs(diferenciaStock) });
            }
        }

        // Recargar la relación actualizada
        const relacionActualizada = await Inventario_Reparacion.findByPk(itemId, {
            include: [
                {
                    association: 'inventario',
                    attributes: ['id', 'nombre', 'descripcion', 'categoria']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Item actualizado exitosamente',
            data: relacionActualizada
        });

    } catch (error) {
        console.error('Error al actualizar item en reparación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Eliminar item de una reparación
// @route   DELETE /api/reparaciones/:reparacionId/inventario/:itemId
// @access  Privado
const eliminarItemDeReparacion = async (req, res) => {
    try {
        const { reparacionId, itemId } = req.params;

        // Buscar la relación
        const relacion = await Inventario_Reparacion.findOne({
            where: {
                id: itemId,
                reparacion_id: reparacionId
            },
            include: ['inventario']
        });

        if (!relacion) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en esta reparación'
            });
        }

        // Devolver el stock al inventario
        await relacion.inventario.increment('stock', { by: relacion.cantidad });

        // Eliminar la relación
        await relacion.destroy();

        res.json({
            success: true,
            message: 'Item eliminado de la reparación exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar item de reparación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener reparaciones que usaron un item específico
// @route   GET /api/inventario/:inventarioId/reparaciones
// @access  Privado
const obtenerReparacionesPorItem = async (req, res) => {
    try {
        const { inventarioId } = req.params;

        // Verificar que el item existe
        const item = await Inventario.findByPk(inventarioId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item de inventario no encontrado'
            });
        }

        const reparaciones = await Inventario_Reparacion.findAll({
            where: { inventario_id: inventarioId },
            include: [
                {
                    association: 'reparacion',
                    attributes: ['id', 'descripcion', 'estado', 'fecha_inicio', 'fecha_fin'],
                    include: [
                        {
                            association: 'vehiculo',
                            attributes: ['id', 'marca', 'modelo', 'placa']
                        }
                    ]
                }
            ],
            order: [['reparacion', 'fecha_inicio', 'DESC']]
        });

        res.json({
            success: true,
            data: reparaciones,
            item: {
                id: item.id,
                nombre: item.nombre,
                categoria: item.categoria
            }
        });

    } catch (error) {
        console.error('Error al obtener reparaciones por item:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

module.exports = {
    agregarItemAReparacion,
    obtenerItemsDeReparacion,
    actualizarItemEnReparacion,
    eliminarItemDeReparacion,
    obtenerReparacionesPorItem
};