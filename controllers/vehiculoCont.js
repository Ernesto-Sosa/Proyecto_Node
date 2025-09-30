const { Vehiculo, Usuario } = require('../models/Vehiculo'); // Ajusta la ruta según tu estructura
const { Op } = require('sequelize');

// @desc    Obtener todos los vehículos
// @route   GET /api/vehiculos
// @access  Privado
const obtenerVehiculos = async (req, res) => {
    try {
        const { pagina = 1, limite = 10, usuario_id, marca, buscar } = req.query;
        
        const whereConditions = {};
        
        // Filtros opcionales
        if (usuario_id) whereConditions.usuario_id = usuario_id;
        if (marca) whereConditions.marca = { [Op.iLike]: `%${marca}%` };
        if (buscar) {
            whereConditions[Op.or] = [
                { marca: { [Op.iLike]: `%${buscar}%` } },
                { modelo: { [Op.iLike]: `%${buscar}%` } },
                { placa: { [Op.iLike]: `%${buscar}%` } }
            ];
        }
        
        const offset = (pagina - 1) * limite;
        
        const vehiculos = await Vehiculo.findAndCountAll({
            where: whereConditions,
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
                }
            ],
            limit: parseInt(limite),
            offset: offset,
            order: [['marca', 'ASC'], ['modelo', 'ASC']]
        });
        
        res.json({
            success: true,
            data: vehiculos.rows,
            total: vehiculos.count,
            paginas: Math.ceil(vehiculos.count / limite),
            pagina: parseInt(pagina)
        });
        
    } catch (error) {
        console.error('Error al obtener vehículos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener un vehículo por ID
// @route   GET /api/vehiculos/:id
// @access  Privado
const obtenerVehiculoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const vehiculo = await Vehiculo.findByPk(id, {
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido', 'email', 'telefono', 'direccion'] 
                }
            ]
        });
        
        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                message: 'Vehículo no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: vehiculo
        });
        
    } catch (error) {
        console.error('Error al obtener vehículo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Crear un nuevo vehículo
// @route   POST /api/vehiculos
// @access  Privado
const crearVehiculo = async (req, res) => {
    try {
        const { marca, modelo, año, placa, usuario_id } = req.body;
        
        // Validaciones básicas
        if (!marca || !modelo || !año || !placa || !usuario_id) {
            return res.status(400).json({
                success: false,
                message: 'Marca, modelo, año, placa y usuario_id son campos requeridos'
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
        
        // Verificar si ya existe un vehículo con la misma placa
        const vehiculoExistente = await Vehiculo.findOne({
            where: { placa }
        });
        
        if (vehiculoExistente) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un vehículo registrado con esta placa'
            });
        }
        
        // Validar formato de año
        const añoNum = parseInt(año);
        const añoActual = new Date().getFullYear();
        
        if (isNaN(añoNum) || añoNum < 1900 || añoNum > añoActual + 1) {
            return res.status(400).json({
                success: false,
                message: 'El año debe ser un número válido entre 1900 y ' + (añoActual + 1)
            });
        }
        
        const nuevoVehiculo = await Vehiculo.create({
            marca,
            modelo,
            año: añoNum,
            placa: placa.toUpperCase(), // Normalizar a mayúsculas
            usuario_id
        });
        
        // Cargar relaciones para la respuesta
        const vehiculoConRelaciones = await Vehiculo.findByPk(nuevoVehiculo.id, {
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido', 'email'] 
                }
            ]
        });
        
        res.status(201).json({
            success: true,
            message: 'Vehículo creado exitosamente',
            data: vehiculoConRelaciones
        });
        
    } catch (error) {
        console.error('Error al crear vehículo:', error);
        
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
                message: 'Error en relación: el usuario no existe'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Actualizar un vehículo
// @route   PUT /api/vehiculos/:id
// @access  Privado
const actualizarVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const { marca, modelo, año, placa, usuario_id } = req.body;
        
        const vehiculo = await Vehiculo.findByPk(id);
        
        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                message: 'Vehículo no encontrado'
            });
        }
        
        // Verificar si el nuevo usuario existe (si se está cambiando)
        if (usuario_id && usuario_id !== vehiculo.usuario_id) {
            const usuarioExiste = await Usuario.findByPk(usuario_id);
            if (!usuarioExiste) {
                return res.status(400).json({
                    success: false,
                    message: 'El usuario especificado no existe'
                });
            }
        }
        
        // Verificar si la nueva placa ya existe (si se está cambiando)
        if (placa && placa !== vehiculo.placa) {
            const placaExistente = await Vehiculo.findOne({
                where: { 
                    placa: placa.toUpperCase(),
                    id: { [Op.ne]: id } // Excluir el vehículo actual
                }
            });
            
            if (placaExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro vehículo registrado con esta placa'
                });
            }
        }
        
        // Preparar campos para actualizar
        const camposActualizar = {};
        if (marca) camposActualizar.marca = marca;
        if (modelo) camposActualizar.modelo = modelo;
        
        // Validar y convertir año si se proporciona
        if (año) {
            const añoNum = parseInt(año);
            const añoActual = new Date().getFullYear();
            
            if (isNaN(añoNum) || añoNum < 1900 || añoNum > añoActual + 1) {
                return res.status(400).json({
                    success: false,
                    message: 'El año debe ser un número válido entre 1900 y ' + (añoActual + 1)
                });
            }
            camposActualizar.año = añoNum;
        }
        
        if (placa) camposActualizar.placa = placa.toUpperCase();
        if (usuario_id) camposActualizar.usuario_id = usuario_id;
        
        await vehiculo.update(camposActualizar);
        
        // Recargar con relaciones
        const vehiculoActualizado = await Vehiculo.findByPk(id, {
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido', 'email'] 
                }
            ]
        });
        
        res.json({
            success: true,
            message: 'Vehículo actualizado exitosamente',
            data: vehiculoActualizado
        });
        
    } catch (error) {
        console.error('Error al actualizar vehículo:', error);
        
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
                message: 'Error en relación: el usuario no existe'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Eliminar un vehículo
// @route   DELETE /api/vehiculos/:id
// @access  Privado
const eliminarVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        
        const vehiculo = await Vehiculo.findByPk(id);
        
        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                message: 'Vehículo no encontrado'
            });
        }
        
        await vehiculo.destroy();
        
        res.json({
            success: true,
            message: 'Vehículo eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error al eliminar vehículo:', error);
        
        // Manejar error de restricción de clave foránea
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el vehículo porque tiene registros asociados (citas, reparaciones, etc.)'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener vehículos por usuario
// @route   GET /api/vehiculos/usuario/:usuarioId
// @access  Privado
const obtenerVehiculosPorUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        
        // Verificar que el usuario existe
        const usuarioExiste = await Usuario.findByPk(usuarioId);
        if (!usuarioExiste) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const vehiculos = await Vehiculo.findAll({
            where: { usuario_id: usuarioId },
            order: [['marca', 'ASC'], ['modelo', 'ASC']]
        });
        
        res.json({
            success: true,
            data: vehiculos,
            usuario: {
                id: usuarioExiste.id,
                nombre: usuarioExiste.nombre,
                apellido: usuarioExiste.apellido
            }
        });
        
    } catch (error) {
        console.error('Error al obtener vehículos por usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Buscar vehículo por placa
// @route   GET /api/vehiculos/buscar/placa/:placa
// @access  Privado
const buscarVehiculoPorPlaca = async (req, res) => {
    try {
        const { placa } = req.params;
        
        const vehiculo = await Vehiculo.findOne({
            where: { 
                placa: { [Op.iLike]: placa } 
            },
            include: [
                { 
                    association: 'usuario', 
                    attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
                }
            ]
        });
        
        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró ningún vehículo con esa placa'
            });
        }
        
        res.json({
            success: true,
            data: vehiculo
        });
        
    } catch (error) {
        console.error('Error al buscar vehículo por placa:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener marcas disponibles
// @route   GET /api/vehiculos/marcas
// @access  Privado
const obtenerMarcas = async (req, res) => {
    try {
        const marcas = await Vehiculo.findAll({
            attributes: ['marca'],
            group: ['marca'],
            order: [['marca', 'ASC']]
        });
        
        const listaMarcas = marcas.map(vehiculo => vehiculo.marca);
        
        res.json({
            success: true,
            data: listaMarcas
        });
        
    } catch (error) {
        console.error('Error al obtener marcas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerVehiculos,
    obtenerVehiculoPorId,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
    obtenerVehiculosPorUsuario,
    buscarVehiculoPorPlaca,
    obtenerMarcas
};