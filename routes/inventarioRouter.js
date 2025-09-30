// routes/inventario.js
const express = require('express');
const router = express.Router();
const {
    obtenerInventario,
    obtenerItemPorId,
    crearItem,
    actualizarItem,
    eliminarItem,
    actualizarStock,
    obtenerStockBajo,
    obtenerCategorias
} = require('../controllers/inventarioCont');

router.get('/', obtenerInventario);
router.get('/categorias', obtenerCategorias);
router.get('/alertas/stock-bajo', obtenerStockBajo);
router.get('/:id', obtenerItemPorId);
router.post('/', crearItem);
router.put('/:id', actualizarItem);
router.patch('/:id/stock', actualizarStock);
router.delete('/:id', eliminarItem);

module.exports = router;