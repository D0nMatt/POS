const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const prisma = new PrismaClient();

// Obtener todas las mesas (para todos los logueados)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const tables = await prisma.table.findMany({ orderBy: { name: 'asc' } });
        res.json(tables);
    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

// Crear una nueva mesa (solo admin)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
    const { name } = req.body;
    try {
        const newTable = await prisma.table.create({ data: { name } });
        res.status(201).json(newTable);
    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

// Actualizar el layout de una mesa (solo admin)
router.put('/:id/layout', [authMiddleware, adminMiddleware], async (req, res) => {
    const { x, y, width, height } = req.body;
    try {
        const updatedTable = await prisma.table.update({
            where: { id: parseInt(req.params.id) },
            data: { x, y, width, height },
        });
        res.json(updatedTable);
    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

module.exports = router;