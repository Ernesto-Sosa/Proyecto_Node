// routes/reparaciones.js
const express = require('express');
const router = express.Router();
const {
    obtenerReparaciones,
    obtenerReparacionPorId,
    crearReparacion,
    actualizarReparacion,
    eliminarReparacion,
    obtenerReparacionesPorUsuario,
    obtenerReparacionesPorVehiculo,
    obtenerReparacionesEnProceso,
    completarReparacion
} = require('../controllers/reparacionCont');

router.get('/', obtenerReparaciones);
router.get('/estado/en-proceso', obtenerReparacionesEnProceso);
router.get('/usuario/:usuarioId', obtenerReparacionesPorUsuario);
router.get('/vehiculo/:vehiculoId', obtenerReparacionesPorVehiculo);
router.get('/:id', obtenerReparacionPorId);
router.post('/', crearReparacion);
router.put('/:id', actualizarReparacion);
router.patch('/:id/completar', completarReparacion);
router.delete('/:id', eliminarReparacion);

module.exports = router;