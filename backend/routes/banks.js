const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const asyncHandler = require('express-async-handler');

const prisma = new PrismaClient();

// GET /api/banks - Obtener todos los bancos/cuentas
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
    const banks = await prisma.bank.findMany({
        orderBy: { name: 'asc' }
    });
    res.json(banks);
}));

// POST /api/banks - Crear un nuevo banco/cuenta
router.post('/', [authMiddleware, adminMiddleware], asyncHandler(async (req, res) => {
    const { name, type, balance } = req.body;
    if (!name || !type) {
        res.status(400);
        throw new Error('El nombre y el tipo son requeridos.');
    }

    const newBank = await prisma.bank.create({
        data: {
            name,
            type,
            balance: balance ? parseFloat(balance) : 0,
        }
    });
    res.status(201).json(newBank);
}));

// PUT /api/banks/:id - Actualizar un banco/cuenta
router.put('/:id', [authMiddleware, adminMiddleware], asyncHandler(async (req, res) => {
    const { name, type, balance } = req.body;
    const bankId = parseInt(req.params.id);

    const updatedBank = await prisma.bank.update({
        where: { id: bankId },
        data: {
            name,
            type,
            balance: balance !== undefined ? parseFloat(balance) : undefined,
        }
    });
    res.json(updatedBank);
}));


module.exports = router;