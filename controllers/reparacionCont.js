const { Reparacion, Usuario, Vehiculo } = require('../models'); // Ajusta la ruta según tu estructura
const { Op } = require('sequelize');

// @desc    Obtener todas las reparaciones
// @route   GET /api/reparaciones
// @access  Privado
const obtenerReparaciones = async (req, res) => {
    try {
        const { pagina = 1, limite = 10, usuario_id, vehiculo_id, estado, fecha_inicio, fecha_fin } = req.query;
        
        const whereConditions = {};
        
        // Filtros opcionales
        if (usuario_id) whereConditions.usuario_id = usuario_id;
        if (vehiculo_id) whereConditions.vehiculo_id = vehiculo_id;
        if (estado) whereConditions.estado = estado;
        
        // Filtros por fecha
        if (fecha_inicio || fecha_fin) {
            whereConditions.fecha_inicio = {};
            if (fecha_inicio) whereConditions.fecha_inicio[Op.gte] = fecha_inicio;
            if (fecha_fin) whereConditions.fecha_inicio[Op.lte] = fecha_fin;
        }
        
        const offset = (pagina - 1) * limite;
        
        const reparaciones = await Reparacion.findAndCountAll({
            where: whereConditions,
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido', 'email'] 
                },
                { 
                    association: 'vehiculo', 
                    attributes: ['id', 'marca', 'modelo', 'placa', 'año'] 
                }
            ],
            limit: parseInt(limite),
            offset: offset,
            order: [['fecha_inicio', 'DESC']]
        });
        
        res.json({
            success: true,
            data: reparaciones.rows,
            total: reparaciones.count,
            paginas: Math.ceil(reparaciones.count / limite),
            pagina: parseInt(pagina)
        });
        
    } catch (error) {
        console.error('Error al obtener reparaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener una reparación por ID
// @route   GET /api/reparaciones/:id
// @access  Privado
const obtenerReparacionPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const reparacion = await Reparacion.findByPk(id, {
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
                },
                { 
                    association: 'vehiculo', 
                    attributes: ['id', 'marca', 'modelo', 'placa', 'año', 'vin'],
                    include: [
                        {
                            association: 'usuario',
                            attributes: ['id', 'nombre', 'apellido', 'telefono']
                        }
                    ]
                }
            ]
        });
        
        if (!reparacion) {
            return res.status(404).json({
                success: false,
                message: 'Reparación no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: reparacion
        });
        
    } catch (error) {
        console.error('Error al obtener reparación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Crear una nueva reparación
// @route   POST /api/reparaciones
// @access  Privado
const crearReparacion = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, descripcion, costo, usuario_id, vehiculo_id } = req.body;
        
        // Validaciones básicas
        if (!fecha_inicio || !descripcion || !usuario_id || !vehiculo_id) {
            return res.status(400).json({
                success: false,
                message: 'Fecha de inicio, descripción, usuario_id y vehiculo_id son campos requeridos'
            });
        }
        
        // Validar que el usuario existe
        const usuarioExiste = await Usuario.findByPk(usuario_id);
        if (!usuarioExiste) {
            return res.status(400).json({
                success: false,
                message: 'El usuario especificado no existe'
            });
        }
        
        // Validar que el vehículo existe
        const vehiculoExiste = await Vehiculo.findByPk(vehiculo_id);
        if (!vehiculoExiste) {
            return res.status(400).json({
                success: false,
                message: 'El vehículo especificado no existe'
            });
        }
        
        // Validar formato de costo si se proporciona
        let costoNum = 0;
        if (costo !== undefined) {
            costoNum = parseFloat(costo);
            if (isNaN(costoNum) || costoNum < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El costo debe ser un número válido mayor o igual a 0'
                });
            }
        }
        
        // Validar fechas
        const fechaInicio = new Date(fecha_inicio);
        if (isNaN(fechaInicio.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de inicio no es válida'
            });
        }
        
        let fechaFin = null;
        if (fecha_fin) {
            fechaFin = new Date(fecha_fin);
            if (isNaN(fechaFin.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de fin no es válida'
                });
            }
            
            // Verificar que fecha_fin no sea anterior a fecha_inicio
            if (fechaFin < fechaInicio) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de fin no puede ser anterior a la fecha de inicio'
                });
            }
        }
        
        // Determinar estado basado en las fechas
        let estado = 'en_proceso';
        if (fechaFin) {
            estado = 'completada';
        }
        
        const nuevaReparacion = await Reparacion.create({
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            descripcion,
            costo: costoNum,
            usuario_id,
            vehiculo_id,
            estado
        });
        
        // Cargar relaciones para la respuesta
        const reparacionConRelaciones = await Reparacion.findByPk(nuevaReparacion.id, {
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido', 'email'] 
                },
                { 
                    association: 'vehiculo', 
                    attributes: ['id', 'marca', 'modelo', 'placa'] 
                }
            ]
        });
        
        res.status(201).json({
            success: true,
            message: 'Reparación creada exitosamente',
            data: reparacionConRelaciones
        });
        
    } catch (error) {
        console.error('Error al crear reparación:', error);
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: error.errors.map(err => err.message)
            });
        }
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Error en relación: usuario o vehículo no existe'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Actualizar una reparación
// @route   PUT /api/reparaciones/:id
// @access  Privado
const actualizarReparacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_inicio, fecha_fin, descripcion, costo, usuario_id, vehiculo_id, estado } = req.body;
        
        const reparacion = await Reparacion.findByPk(id);
        
        if (!reparacion) {
            return res.status(404).json({
                success: false,
                message: 'Reparación no encontrada'
            });
        }
        
        // Validar que el usuario existe (si se está cambiando)
        if (usuario_id && usuario_id !== reparacion.usuario_id) {
            const usuarioExiste = await Usuario.findByPk(usuario_id);
            if (!usuarioExiste) {
                return res.status(400).json({
                    success: false,
                    message: 'El usuario especificado no existe'
                });
            }
        }
        
        // Validar que el vehículo existe (si se está cambiando)
        if (vehiculo_id && vehiculo_id !== reparacion.vehiculo_id) {
            const vehiculoExiste = await Vehiculo.findByPk(vehiculo_id);
            if (!vehiculoExiste) {
                return res.status(400).json({
                    success: false,
                    message: 'El vehículo especificado no existe'
                });
            }
        }
        
        // Preparar campos para actualizar
        const camposActualizar = {};
        
        // Validar y procesar fecha_inicio
        if (fecha_inicio) {
            const fechaInicio = new Date(fecha_inicio);
            if (isNaN(fechaInicio.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de inicio no es válida'
                });
            }
            camposActualizar.fecha_inicio = fechaInicio;
        }
        
        // Validar y procesar fecha_fin
        if (fecha_fin !== undefined) {
            if (fecha_fin === null) {
                camposActualizar.fecha_fin = null;
            } else {
                const fechaFin = new Date(fecha_fin);
                if (isNaN(fechaFin.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'La fecha de fin no es válida'
                    });
                }
                
                // Verificar que fecha_fin no sea anterior a fecha_inicio
                const fechaInicioComparar = camposActualizar.fecha_inicio || reparacion.fecha_inicio;
                if (fechaFin < fechaInicioComparar) {
                    return res.status(400).json({
                        success: false,
                        message: 'La fecha de fin no puede ser anterior a la fecha de inicio'
                    });
                }
                camposActualizar.fecha_fin = fechaFin;
            }
        }
        
        if (descripcion !== undefined) camposActualizar.descripcion = descripcion;
        
        // Validar y procesar costo
        if (costo !== undefined) {
            const costoNum = parseFloat(costo);
            if (isNaN(costoNum) || costoNum < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El costo debe ser un número válido mayor o igual a 0'
                });
            }
            camposActualizar.costo = costoNum;
        }
        
        if (usuario_id) camposActualizar.usuario_id = usuario_id;
        if (vehiculo_id) camposActualizar.vehiculo_id = vehiculo_id;
        if (estado) camposActualizar.estado = estado;
        
        // Actualizar estado automáticamente si se completa fecha_fin
        if (fecha_fin !== undefined && fecha_fin !== null && !estado) {
            camposActualizar.estado = 'completada';
        }
        
        await reparacion.update(camposActualizar);
        
        // Recargar con relaciones
        const reparacionActualizada = await Reparacion.findByPk(id, {
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido', 'email'] 
                },
                { 
                    association: 'vehiculo', 
                    attributes: ['id', 'marca', 'modelo', 'placa'] 
                }
            ]
        });
        
        res.json({
            success: true,
            message: 'Reparación actualizada exitosamente',
            data: reparacionActualizada
        });
        
    } catch (error) {
        console.error('Error al actualizar reparación:', error);
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: error.errors.map(err => err.message)
            });
        }
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Error en relación: usuario o vehículo no existe'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Eliminar una reparación
// @route   DELETE /api/reparaciones/:id
// @access  Privado
const eliminarReparacion = async (req, res) => {
    try {
        const { id } = req.params;
        
        const reparacion = await Reparacion.findByPk(id);
        
        if (!reparacion) {
            return res.status(404).json({
                success: false,
                message: 'Reparación no encontrada'
            });
        }
        
        await reparacion.destroy();
        
        res.json({
            success: true,
            message: 'Reparación eliminada exitosamente'
        });
        
    } catch (error) {
        console.error('Error al eliminar reparación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener reparaciones por usuario (mecánico)
// @route   GET /api/reparaciones/usuario/:usuarioId
// @access  Privado
const obtenerReparacionesPorUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { estado, limite = 20 } = req.query;
        
        const whereConditions = { usuario_id: usuarioId };
        if (estado) whereConditions.estado = estado;
        
        const reparaciones = await Reparacion.findAll({
            where: whereConditions,
            include: [
                { 
                    association: 'vehiculo', 
                    attributes: ['id', 'marca', 'modelo', 'placa'] 
                }
            ],
            limit: parseInt(limite),
            order: [['fecha_inicio', 'DESC']]
        });
        
        res.json({
            success: true,
            data: reparaciones,
            total: reparaciones.length
        });
        
    } catch (error) {
        console.error('Error al obtener reparaciones por usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener reparaciones por vehículo
// @route   GET /api/reparaciones/vehiculo/:vehiculoId
// @access  Privado
const obtenerReparacionesPorVehiculo = async (req, res) => {
    try {
        const { vehiculoId } = req.params;
        const { limite = 50 } = req.query;
        
        const reparaciones = await Reparacion.findAll({
            where: { vehiculo_id: vehiculoId },
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido'] 
                }
            ],
            limit: parseInt(limite),
            order: [['fecha_inicio', 'DESC']]
        });
        
        res.json({
            success: true,
            data: reparaciones,
            total: reparaciones.length
        });
        
    } catch (error) {
        console.error('Error al obtener reparaciones por vehículo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener reparaciones en curso
// @route   GET /api/reparaciones/estado/en-proceso
// @access  Privado
const obtenerReparacionesEnProceso = async (req, res) => {
    try {
        const { limite = 20 } = req.query;
        
        const reparaciones = await Reparacion.findAll({
            where: { 
                estado: 'en_proceso',
                fecha_fin: null
            },
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido'] 
                },
                { 
                    association: 'vehiculo', 
                    attributes: ['id', 'marca', 'modelo', 'placa'] 
                }
            ],
            limit: parseInt(limite),
            order: [['fecha_inicio', 'ASC']]
        });
        
        res.json({
            success: true,
            data: reparaciones,
            total: reparaciones.length
        });
        
    } catch (error) {
        console.error('Error al obtener reparaciones en proceso:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Completar una reparación
// @route   PATCH /api/reparaciones/:id/completar
// @access  Privado
const completarReparacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { costo } = req.body;
        
        const reparacion = await Reparacion.findByPk(id);
        
        if (!reparacion) {
            return res.status(404).json({
                success: false,
                message: 'Reparación no encontrada'
            });
        }
        
        if (reparacion.estado === 'completada') {
            return res.status(400).json({
                success: false,
                message: 'La reparación ya está completada'
            });
        }
        
        const camposActualizar = {
            fecha_fin: new Date(),
            estado: 'completada'
        };
        
        if (costo !== undefined) {
            const costoNum = parseFloat(costo);
            if (isNaN(costoNum) || costoNum < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El costo debe ser un número válido mayor o igual a 0'
                });
            }
            camposActualizar.costo = costoNum;
        }
        
        await reparacion.update(camposActualizar);
        
        const reparacionActualizada = await Reparacion.findByPk(id, {
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido'] 
                },
                { 
                    association: 'vehiculo', 
                    attributes: ['id', 'marca', 'modelo', 'placa'] 
                }
            ]
        });
        
        res.json({
            success: true,
            message: 'Reparación marcada como completada',
            data: reparacionActualizada
        });
        
    } catch (error) {
        console.error('Error al completar reparación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

const obtenerCostoTotalReparacion = async (req, res) => {
    try {
        const { id } = req.params;

        const reparacion = await Reparacion.findByPk(id);
        if (!reparacion) {
            return res.status(404).json({
                success: false,
                message: 'Reparación no encontrada'
            });
        }

        // Obtener items de inventario asociados
        const itemsReparacion = await InventarioReparacion.findAll({
            where: { reparacion_id: id },
            attributes: ['cantidad', 'precio_unitario']
        });

        // Calcular costo de repuestos
        const costoRepuestos = itemsReparacion.reduce((total, item) => {
            return total + (item.cantidad * item.precio_unitario);
        }, 0);

        const costoTotal = parseFloat(reparacion.costo || 0) + costoRepuestos;

        res.json({
            success: true,
            data: {
                reparacion_id: id,
                costo_mano_obra: reparacion.costo,
                costo_repuestos: costoRepuestos,
                costo_total: costoTotal,
                total_items: itemsReparacion.length
            }
        });

    } catch (error) {
        console.error('Error al calcular costo total:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerReparaciones,
    obtenerReparacionPorId,
    crearReparacion,
    actualizarReparacion,
    eliminarReparacion,
    obtenerReparacionesPorUsuario,
    obtenerReparacionesPorVehiculo,
    obtenerReparacionesEnProceso,
    completarReparacion
};