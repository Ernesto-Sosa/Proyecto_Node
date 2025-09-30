// routes/vehiculos.js
const express = require('express');
const router = express.Router();
const {
    obtenerVehiculos,
    obtenerVehiculoPorId,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
    obtenerVehiculosPorUsuario,
    buscarVehiculoPorPlaca,
    obtenerMarcas
} = require('../controllers/vehiculoCont');

router.get('/', obtenerVehiculos);
router.get('/marcas', obtenerMarcas);
router.get('/usuario/:usuarioId', obtenerVehiculosPorUsuario);
router.get('/buscar/placa/:placa', buscarVehiculoPorPlaca);
router.get('/:id', obtenerVehiculoPorId);
router.post('/', crearVehiculo);
router.put('/:id', actualizarVehiculo);
router.delete('/:id', eliminarVehiculo);

module.exports = router;