// routes/citas.js
const express = require('express');
const router = express.Router();
const {
    obtenerCitas,
    obtenerCitaPorId,
    crearCita,
    actualizarCita,
    eliminarCita,
    obtenerCitasPorUsuario,
    obtenerCitasPorVehiculo
} = require('../controllers/citaCont');



router.get('/', obtenerCitas);
router.get('/:id', obtenerCitaPorId);
router.post('/', crearCita);
router.put('/:id', actualizarCita);
router.delete('/:id', eliminarCita);
router.get('/usuario/:usuarioId', obtenerCitasPorUsuario);
router.get('/vehiculo/:vehiculoId', obtenerCitasPorVehiculo);

module.exports = router;