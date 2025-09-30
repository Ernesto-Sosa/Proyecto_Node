const { Usuario } = require('../models/Usuario'); // Ajusta la ruta según tu estructura
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Obtener todos los usuarios
// @route   GET /api/usuarios
// @access  Privado (Admin)
const obtenerUsuarios = async (req, res) => {
    try {
        const { pagina = 1, limite = 10, rol, buscar } = req.query;
        
        const whereConditions = {};
        
        // Filtros opcionales
        if (rol) whereConditions.rol = rol;
        if (buscar) {
            whereConditions[Op.or] = [
                { nombre: { [Op.iLike]: `%${buscar}%` } },
                { email: { [Op.iLike]: `%${buscar}%` } },
                { telefono: { [Op.iLike]: `%${buscar}%` } }
            ];
        }
        
        const offset = (pagina - 1) * limite;
        
        const usuarios = await Usuario.findAndCountAll({
            where: whereConditions,
            attributes: { exclude: ['password'] }, // Excluir password de la respuesta
            limit: parseInt(limite),
            offset: offset,
            order: [['nombre', 'ASC']]
        });
        
        res.json({
            success: true,
            data: usuarios.rows,
            total: usuarios.count,
            paginas: Math.ceil(usuarios.count / limite),
            pagina: parseInt(pagina)
        });
        
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener un usuario por ID
// @route   GET /api/usuarios/:id
// @access  Privado
const obtenerUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['password'] } // Excluir password de la respuesta
        });
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: usuario
        });
        
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener perfil del usuario actual
// @route   GET /api/usuarios/perfil/mi-perfil
// @access  Privado
const obtenerMiPerfil = async (req, res) => {
    try {
        // Asumiendo que el ID del usuario viene del middleware de autenticación
        const usuarioId = req.usuario.id;
        
        const usuario = await Usuario.findByPk(usuarioId, {
            attributes: { exclude: ['password'] }
        });
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: usuario
        });
        
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Crear un nuevo usuario
// @route   POST /api/usuarios
// @access  Privado (Admin) o Público para registro
const crearUsuario = async (req, res) => {
    try {
        const { nombre, email, password, rol, telefono } = req.body;
        
        // Validaciones básicas
        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y password son campos requeridos'
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del email no es válido'
            });
        }
        
        // Verificar si ya existe un usuario con el mismo email
        const usuarioExistente = await Usuario.findOne({
            where: { email }
        });
        
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario registrado con este email'
            });
        }
        
        // Encriptar password
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptado = await bcrypt.hash(password, salt);
        
        // Validar y establecer rol por defecto
        const rolesPermitidos = ['admin', 'mecanico', 'cliente', 'recepcionista'];
        const rolFinal = rol && rolesPermitidos.includes(rol) ? rol : 'cliente';
        
        const nuevoUsuario = await Usuario.create({
            nombre,
            email: email.toLowerCase(),
            password: passwordEncriptado,
            rol: rolFinal,
            telefono: telefono || null
        });
        
        // Excluir password de la respuesta
        const usuarioRespuesta = {
            id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol,
            telefono: nuevoUsuario.telefono,
            created_at: nuevoUsuario.created_at
        };
        
        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: usuarioRespuesta
        });
        
    } catch (error) {
        console.error('Error al crear usuario:', error);
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: error.errors.map(err => err.message)
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Actualizar un usuario
// @route   PUT /api/usuarios/:id
// @access  Privado
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, password, rol, telefono } = req.body;
        
        const usuario = await Usuario.findByPk(id);
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Preparar campos para actualizar
        const camposActualizar = {};
        
        if (nombre) camposActualizar.nombre = nombre;
        if (telefono !== undefined) camposActualizar.telefono = telefono;
        
        // Validar y actualizar email si se proporciona
        if (email && email !== usuario.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'El formato del email no es válido'
                });
            }
            
            // Verificar si el nuevo email ya existe
            const emailExistente = await Usuario.findOne({
                where: { 
                    email: email.toLowerCase(),
                    id: { [Op.ne]: id }
                }
            });
            
            if (emailExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro usuario con este email'
                });
            }
            
            camposActualizar.email = email.toLowerCase();
        }
        
        // Actualizar password si se proporciona
        if (password) {
            const salt = await bcrypt.genSalt(10);
            camposActualizar.password = await bcrypt.hash(password, salt);
        }
        
        // Actualizar rol si se proporciona y el usuario tiene permisos
        if (rol) {
            const rolesPermitidos = ['admin', 'mecanico', 'cliente', 'recepcionista'];
            if (rolesPermitidos.includes(rol)) {
                camposActualizar.rol = rol;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Rol no válido. Roles permitidos: ' + rolesPermitidos.join(', ')
                });
            }
        }
        
        await usuario.update(camposActualizar);
        
        // Recargar usuario sin password
        const usuarioActualizado = await Usuario.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: usuarioActualizado
        });
        
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: error.errors.map(err => err.message)
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Actualizar perfil del usuario actual
// @route   PUT /api/usuarios/perfil/mi-perfil
// @access  Privado
const actualizarMiPerfil = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { nombre, email, telefono, password_actual, nuevo_password } = req.body;
        
        const usuario = await Usuario.findByPk(usuarioId);
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const camposActualizar = {};
        
        if (nombre) camposActualizar.nombre = nombre;
        if (telefono !== undefined) camposActualizar.telefono = telefono;
        
        // Validar y actualizar email
        if (email && email !== usuario.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'El formato del email no es válido'
                });
            }
            
            const emailExistente = await Usuario.findOne({
                where: { 
                    email: email.toLowerCase(),
                    id: { [Op.ne]: usuarioId }
                }
            });
            
            if (emailExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro usuario con este email'
                });
            }
            
            camposActualizar.email = email.toLowerCase();
        }
        
        // Cambiar password si se proporcionan ambos
        if (password_actual && nuevo_password) {
            // Verificar password actual
            const passwordValido = await bcrypt.compare(password_actual, usuario.password);
            if (!passwordValido) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña actual es incorrecta'
                });
            }
            
            // Encriptar nuevo password
            const salt = await bcrypt.genSalt(10);
            camposActualizar.password = await bcrypt.hash(nuevo_password, salt);
        } else if ((password_actual && !nuevo_password) || (!password_actual && nuevo_password)) {
            return res.status(400).json({
                success: false,
                message: 'Para cambiar la contraseña, debe proporcionar tanto la contraseña actual como la nueva'
            });
        }
        
        await usuario.update(camposActualizar);
        
        const usuarioActualizado = await Usuario.findByPk(usuarioId, {
            attributes: { exclude: ['password'] }
        });
        
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: usuarioActualizado
        });
        
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Eliminar un usuario
// @route   DELETE /api/usuarios/:id
// @access  Privado (Admin)
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Evitar que un usuario se elimine a sí mismo
        if (parseInt(id) === parseInt(req.usuario.id)) {
            return res.status(400).json({
                success: false,
                message: 'No puede eliminar su propio usuario'
            });
        }
        
        const usuario = await Usuario.findByPk(id);
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        await usuario.destroy();
        
        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        
        // Manejar error de restricción de clave foránea
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el usuario porque tiene registros asociados (vehículos, citas, reparaciones, etc.)'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener usuarios por rol
// @route   GET /api/usuarios/rol/:rol
// @access  Privado
const obtenerUsuariosPorRol = async (req, res) => {
    try {
        const { rol } = req.params;
        
        const rolesPermitidos = ['admin', 'mecanico', 'cliente', 'recepcionista'];
        if (!rolesPermitidos.includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol no válido. Roles permitidos: ' + rolesPermitidos.join(', ')
            });
        }
        
        const usuarios = await Usuario.findAll({
            where: { rol },
            attributes: { exclude: ['password'] },
            order: [['nombre', 'ASC']]
        });
        
        res.json({
            success: true,
            data: usuarios,
            total: usuarios.length,
            rol: rol
        });
        
    } catch (error) {
        console.error('Error al obtener usuarios por rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener estadísticas de usuarios
// @route   GET /api/usuarios/estadisticas/totales
// @access  Privado (Admin)
const obtenerEstadisticasUsuarios = async (req, res) => {
    try {
        const totalUsuarios = await Usuario.count();
        
        const usuariosPorRol = await Usuario.findAll({
            attributes: [
                'rol',
                [Usuario.sequelize.fn('COUNT', Usuario.sequelize.col('id')), 'total']
            ],
            group: ['rol'],
            raw: true
        });
        
        const usuariosRecientes = await Usuario.findAll({
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']],
            limit: 5
        });
        
        res.json({
            success: true,
            data: {
                total_usuarios: totalUsuarios,
                por_rol: usuariosPorRol,
                recientes: usuariosRecientes
            }
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    obtenerMiPerfil,
    crearUsuario,
    actualizarUsuario,
    actualizarMiPerfil,
    eliminarUsuario,
    obtenerUsuariosPorRol,
    obtenerEstadisticasUsuarios
};