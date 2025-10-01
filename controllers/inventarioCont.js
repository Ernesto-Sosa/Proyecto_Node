const { Inventario } = require('../models'); // Ajusta la ruta según tu estructura
const { Op } = require('sequelize');

// @desc    Obtener todos los items del inventario
// @route   GET /api/inventario
// @access  Privado
const obtenerInventario = async (req, res) => {
    try {
        const { pagina = 1, limite = 10, categoria, stockMinimo, buscar } = req.query;
        
        const whereConditions = {};
        
        // Filtros opcionales
        if (categoria) whereConditions.categoria = categoria;
        if (stockMinimo === 'true') {
            whereConditions.stock = {
                [Op.lt]: 5 // Stock menor a 5 unidades
            };
        }
        if (buscar) {
            whereConditions[Op.or] = [
                { nombre: { [Op.iLike]: `%${buscar}%` } },
                { descripcion: { [Op.iLike]: `%${buscar}%` } }
            ];
        }
        
        const offset = (pagina - 1) * limite;
        
        const inventario = await Inventario.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limite),
            offset: offset,
            order: [['nombre', 'ASC']]
        });
        
        res.json({
            success: true,
            data: inventario.rows,
            total: inventario.count,
            paginas: Math.ceil(inventario.count / limite),
            pagina: parseInt(pagina)
        });
        
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener un item del inventario por ID
// @route   GET /api/inventario/:id
// @access  Privado
const obtenerItemPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const item = await Inventario.findByPk(id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el inventario'
            });
        }
        
        res.json({
            success: true,
            data: item
        });
        
    } catch (error) {
        console.error('Error al obtener item:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Crear un nuevo item en el inventario
// @route   POST /api/inventario
// @access  Privado
const crearItem = async (req, res) => {
    try {
        const { nombre, descripcion, categoria, precio, stock } = req.body;
        
        // Validaciones básicas
        if (!nombre || !categoria || precio === undefined || stock === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, categoría, precio y stock son campos requeridos'
            });
        }
        
        // Validar que el precio y stock sean números válidos
        const precioNum = parseFloat(precio);
        const stockNum = parseInt(stock);
        
        if (isNaN(precioNum) || precioNum < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser un número válido mayor o igual a 0'
            });
        }
        
        if (isNaN(stockNum) || stockNum < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock debe ser un número entero válido mayor o igual a 0'
            });
        }
        
        // Verificar si ya existe un item con el mismo nombre
        const itemExistente = await Inventario.findOne({
            where: { nombre }
        });
        
        if (itemExistente) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un item en el inventario con ese nombre'
            });
        }
        
        const nuevoItem = await Inventario.create({
            nombre,
            descripcion: descripcion || '',
            categoria,
            precio: precioNum,
            stock: stockNum
        });
        
        res.status(201).json({
            success: true,
            message: 'Item creado exitosamente en el inventario',
            data: nuevoItem
        });
        
    } catch (error) {
        console.error('Error al crear item:', error);
        
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

// @desc    Actualizar un item del inventario
// @route   PUT /api/inventario/:id
// @access  Privado
const actualizarItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, categoria, precio, stock } = req.body;
        
        const item = await Inventario.findByPk(id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el inventario'
            });
        }
        
        // Verificar si el nuevo nombre ya existe (si se está cambiando)
        if (nombre && nombre !== item.nombre) {
            const itemExistente = await Inventario.findOne({
                where: { 
                    nombre,
                    id: { [Op.ne]: id } // Excluir el item actual
                }
            });
            
            if (itemExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro item en el inventario con ese nombre'
                });
            }
        }
        
        // Preparar campos para actualizar
        const camposActualizar = {};
        if (nombre) camposActualizar.nombre = nombre;
        if (descripcion !== undefined) camposActualizar.descripcion = descripcion;
        if (categoria) camposActualizar.categoria = categoria;
        
        // Validar y convertir precio si se proporciona
        if (precio !== undefined) {
            const precioNum = parseFloat(precio);
            if (isNaN(precioNum) || precioNum < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio debe ser un número válido mayor o igual a 0'
                });
            }
            camposActualizar.precio = precioNum;
        }
        
        // Validar y convertir stock si se proporciona
        if (stock !== undefined) {
            const stockNum = parseInt(stock);
            if (isNaN(stockNum) || stockNum < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El stock debe ser un número entero válido mayor o igual a 0'
                });
            }
            camposActualizar.stock = stockNum;
        }
        
        await item.update(camposActualizar);
        
        // Recargar el item actualizado
        const itemActualizado = await Inventario.findByPk(id);
        
        res.json({
            success: true,
            message: 'Item actualizado exitosamente',
            data: itemActualizado
        });
        
    } catch (error) {
        console.error('Error al actualizar item:', error);
        
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

// @desc    Eliminar un item del inventario
// @route   DELETE /api/inventario/:id
// @access  Privado
const eliminarItem = async (req, res) => {
    try {
        const { id } = req.params;
        
        const item = await Inventario.findByPk(id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el inventario'
            });
        }
        
        await item.destroy();
        
        res.json({
            success: true,
            message: 'Item eliminado exitosamente del inventario'
        });
        
    } catch (error) {
        console.error('Error al eliminar item:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Actualizar stock de un item
// @route   PATCH /api/inventario/:id/stock
// @access  Privado
const actualizarStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock, operacion } = req.body; // operacion: 'incrementar', 'decrementar', 'establecer'
        
        if (stock === undefined) {
            return res.status(400).json({
                success: false,
                message: 'El campo stock es requerido'
            });
        }
        
        const item = await Inventario.findByPk(id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el inventario'
            });
        }
        
        let nuevoStock;
        const stockNum = parseInt(stock);
        
        if (isNaN(stockNum) || stockNum < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock debe ser un número entero válido mayor o igual a 0'
            });
        }
        
        switch (operacion) {
            case 'incrementar':
                nuevoStock = item.stock + stockNum;
                break;
            case 'decrementar':
                nuevoStock = item.stock - stockNum;
                if (nuevoStock < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'No hay suficiente stock para realizar esta operación'
                    });
                }
                break;
            case 'establecer':
            default:
                nuevoStock = stockNum;
                break;
        }
        
        await item.update({ stock: nuevoStock });
        
        res.json({
            success: true,
            message: 'Stock actualizado exitosamente',
            data: {
                ...item.toJSON(),
                stock: nuevoStock
            }
        });
        
    } catch (error) {
        console.error('Error al actualizar stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener items con stock bajo
// @route   GET /api/inventario/alertas/stock-bajo
// @access  Privado
const obtenerStockBajo = async (req, res) => {
    try {
        const { limite = 10 } = req.query;
        
        const itemsStockBajo = await Inventario.findAll({
            where: {
                stock: {
                    [Op.lt]: 5 // Stock menor a 5 unidades
                }
            },
            limit: parseInt(limite),
            order: [['stock', 'ASC']]
        });
        
        res.json({
            success: true,
            data: itemsStockBajo,
            total: itemsStockBajo.length
        });
        
    } catch (error) {
        console.error('Error al obtener items con stock bajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// @desc    Obtener categorías disponibles
// @route   GET /api/inventario/categorias
// @access  Privado
const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await Inventario.findAll({
            attributes: ['categoria'],
            group: ['categoria'],
            order: [['categoria', 'ASC']]
        });
        
        const listaCategorias = categorias.map(item => item.categoria);
        
        res.json({
            success: true,
            data: listaCategorias
        });
        
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerInventario,
    obtenerItemPorId,
    crearItem,
    actualizarItem,
    eliminarItem,
    actualizarStock,
    obtenerStockBajo,
    obtenerCategorias
};