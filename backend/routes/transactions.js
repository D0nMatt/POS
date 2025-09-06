const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const asyncHandler = require('express-async-handler');

const prisma = new PrismaClient();

// GET /api/transactions - Obtener un historial de todas las transacciones
router.get('/', [authMiddleware, adminMiddleware], asyncHandler(async (req, res) => {
    const transactions = await prisma.transaction.findMany({
        orderBy: {
            createdAt: 'desc' // Las más recientes primero
        },
        include: {
            bank: { // Incluimos el nombre del banco para saber de dónde vino/fue el dinero
                select: {
                    name: true
                }
            }
        }
    });
    res.json(transactions);
}));

module.exports = router;