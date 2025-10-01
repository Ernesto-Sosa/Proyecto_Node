const { Cita } = require('../models');
const { Op } = require('sequelize');


const obtenerCitas = async (req, res) => {
    try {
        const { pagina = 1, limite = 10, estado, fecha } = req.query;
        
        const whereConditions = {};
        
        // Filtros opcionales
        if (estado) whereConditions.estado = estado;
        if (fecha) whereConditions.fecha = fecha;
        
        const offset = (pagina - 1) * limite;
        
        const citas = await Cita.findAndCountAll({
            where: whereConditions,
            include: [
                { association: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email'] },
                { association: 'vehiculo', attributes: ['id', 'marca', 'modelo', 'placa'] }
            ],
            limit: parseInt(limite),
            offset: offset,
            order: [['fecha', 'ASC'], ['hora', 'ASC']]
        });
        
        res.json({
            success: true,
            data: citas.rows,
            total: citas.count,
            paginas: Math.ceil(citas.count / limite),
            pagina: parseInt(pagina)
        });
        
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};


const obtenerCitaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const cita = await Cita.findByPk(id, {
            include: [
                { association: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] },
                { association: 'vehiculo', attributes: ['id', 'marca', 'modelo', 'placa', 'año', 'vin'] }
            ]
        });
        
        if (!cita) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: cita
        });
        
    } catch (error) {
        console.error('Error al obtener cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};


const crearCita = async (req, res) => {
    try {
        const { fecha, hora, descripcion, estado, usuario_id, vehiculo_id } = req.body;
        
        // Validaciones básicas
        if (!fecha || !hora || !usuario_id || !vehiculo_id) {
            return res.status(400).json({
                success: false,
                message: 'Fecha, hora, usuario_id y vehiculo_id son campos requeridos'
            });
        }
        
        // Verificar si ya existe una cita en la misma fecha y hora
        const citaExistente = await Cita.findOne({
            where: {
                fecha,
                hora,
                estado: {
                    [Op.ne]: 'cancelada'
                }
            }
        });
        
        if (citaExistente) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una cita programada para esta fecha y hora'
            });
        }
        
        const nuevaCita = await Cita.create({
            fecha,
            hora,
            descripcion: descripcion || '',
            estado: estado || 'programada', 
            usuario_id,
            vehiculo_id
        });
        
        // Cargar relaciones para la respuesta
        const citaConRelaciones = await Cita.findByPk(nuevaCita.id, {
            include: [
                { association: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email'] },
                { association: 'vehiculo', attributes: ['id', 'marca', 'modelo', 'placa'] }
            ]
        });
        
        res.status(201).json({
            success: true,
            message: 'Cita creada exitosamente',
            data: citaConRelaciones
        });
        
    } catch (error) {
        console.error('Error al crear cita:', error);
        
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


const actualizarCita = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, hora, descripcion, estado, usuario_id, vehiculo_id } = req.body;
        
        const cita = await Cita.findByPk(id);
        
        if (!cita) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }
        
        // Verificar conflicto de horarios (solo si se cambia fecha u hora)
        if (fecha || hora) {
            const fechaActualizada = fecha || cita.fecha;
            const horaActualizada = hora || cita.hora;
            
            const citaExistente = await Cita.findOne({
                where: {
                    id: { [Op.ne]: id }, 
                    fecha: fechaActualizada,
                    hora: horaActualizada,
                    estado: {
                        [Op.ne]: 'cancelada'
                    }
                }
            });
            
            if (citaExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otra cita programada para esta fecha y hora'
                });
            }
        }
        
        // Actualizar campos
        const camposActualizar = {};
        if (fecha) camposActualizar.fecha = fecha;
        if (hora) camposActualizar.hora = hora;
        if (descripcion !== undefined) camposActualizar.descripcion = descripcion;
        if (estado) camposActualizar.estado = estado;
        if (usuario_id) camposActualizar.usuario_id = usuario_id;
        if (vehiculo_id) camposActualizar.vehiculo_id = vehiculo_id;
        
        await cita.update(camposActualizar);
        
        // Recargar con relaciones
        const citaActualizada = await Cita.findByPk(id, {
            include: [
                { association: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email'] },
                { association: 'vehiculo', attributes: ['id', 'marca', 'modelo', 'placa'] }
            ]
        });
        
        res.json({
            success: true,
            message: 'Cita actualizada exitosamente',
            data: citaActualizada
        });
        
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        
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


const eliminarCita = async (req, res) => {
    try {
        const { id } = req.params;
        
        const cita = await Cita.findByPk(id);
        
        if (!cita) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }
        
        await cita.destroy();
        
        res.json({
            success: true,
            message: 'Cita eliminada exitosamente'
        });
        
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};


const obtenerCitasPorUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { estado } = req.query;
        
        const whereConditions = { usuario_id: usuarioId };
        if (estado) whereConditions.estado = estado;
        
        const citas = await Cita.findAll({
            where: whereConditions,
            include: [
                { association: 'vehiculo', attributes: ['id', 'marca', 'modelo', 'placa'] }
            ],
            order: [['fecha', 'DESC'], ['hora', 'DESC']]
        });
        
        res.json({
            success: true,
            data: citas
        });
        
    } catch (error) {
        console.error('Error al obtener citas por usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};


const obtenerCitasPorVehiculo = async (req, res) => {
    try {
        const { vehiculoId } = req.params;
        
        const citas = await Cita.findAll({
            where: { vehiculo_id: vehiculoId },
            include: [
                { association: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email'] }
            ],
            order: [['fecha', 'DESC'], ['hora', 'DESC']]
        });
        
        res.json({
            success: true,
            data: citas
        });
        
    } catch (error) {
        console.error('Error al obtener citas por vehículo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerCitas,
    obtenerCitaPorId,
    crearCita,
    actualizarCita,
    eliminarCita,
    obtenerCitasPorUsuario,
    obtenerCitasPorVehiculo
};