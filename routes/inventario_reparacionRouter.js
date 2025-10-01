// routes/inventarioReparacion.js
const express = require('express');
const router = express.Router();
const {
    agregarItemAReparacion,
    obtenerItemsDeReparacion,
    actualizarItemEnReparacion,
    eliminarItemDeReparacion,
    obtenerReparacionesPorItem
} = require('../controllers/inventario_reparacionCont');


router.post('/reparaciones/:reparacionId/inventario', agregarItemAReparacion);
router.get('/reparaciones/:reparacionId/inventario', obtenerItemsDeReparacion);
router.put('/reparaciones/:reparacionId/inventario/:itemId', actualizarItemEnReparacion);
router.delete('/reparaciones/:reparacionId/inventario/:itemId', eliminarItemDeReparacion);


router.get('/inventario/:inventarioId/reparaciones', obtenerReparacionesPorItem);

module.exports = router;