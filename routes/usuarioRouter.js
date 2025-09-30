// routes/usuarios.js
const express = require('express');
const router = express.Router();
const {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    obtenerMiPerfil,
    crearUsuario,
    actualizarUsuario,
    actualizarMiPerfil,
    eliminarUsuario,
    obtenerUsuariosPorRol,
    obtenerEstadisticasUsuarios
} = require('../controllers/usuarioCont');

// Middleware de autenticación y autorización
const { autenticar, esAdmin } = require('../middleware/auth');

// Rutas públicas (si es necesario)
// router.post('/', crearUsuario); // Para registro público

// Rutas protegidas
router.get('/', autenticar, esAdmin, obtenerUsuarios);
router.get('/estadisticas/totales', autenticar, esAdmin, obtenerEstadisticasUsuarios);
router.get('/rol/:rol', autenticar, obtenerUsuariosPorRol);
router.get('/perfil/mi-perfil', autenticar, obtenerMiPerfil);
router.get('/:id', autenticar, obtenerUsuarioPorId);
router.post('/', autenticar, esAdmin, crearUsuario);
router.put('/perfil/mi-perfil', autenticar, actualizarMiPerfil);
router.put('/:id', autenticar, actualizarUsuario);
router.delete('/:id', autenticar, esAdmin, eliminarUsuario);

module.exports = router;