// middleware/auth.js
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models/Usuario');

const autenticar = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. No hay token proporcionado.'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const usuario = await Usuario.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Token no válido.'
            });
        }
        
        req.usuario = usuario;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token no válido.'
        });
    }
};

const esAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren privilegios de administrador.'
        });
    }
    next();
};

module.exports = { autenticar, esAdmin };