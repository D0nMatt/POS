const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const asyncHandler = require('express-async-handler');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/categories - Obtener todas las categorías
router.get('/', authMiddleware, asyncHandler(async (req, res) => { 
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });
    res.json(categories);
}));

// POST /api/categories - Crear una nueva categoría
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ msg: 'El nombre es requerido.' });
    }
    try {
        const newCategory = await prisma.category.create({
            data: { name }
        });
        res.status(201).json(newCategory);
    } catch (err) {
        // Código 'P2002' es para violaciones de restricción única en Prisma
        if (err.code === 'P2002') {
            return res.status(400).json({ msg: 'Ya existe una categoría con ese nombre.' });
        }
        res.status(500).send('Error en el servidor');
    }
});

// DELETE /api/categories/:id - Eliminar una categoría
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        // Opcional: Verificar si hay productos usando esta categoría antes de borrar.
        const productsInCategory = await prisma.product.count({ where: { categoryId } });
        if (productsInCategory > 0) {
            return res.status(400).json({ msg: 'No se puede eliminar la categoría porque tiene productos asociados.' });
        }
        await prisma.category.delete({ where: { id: categoryId } });
        res.json({ msg: 'Categoría eliminada correctamente.' });
    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

module.exports = router;