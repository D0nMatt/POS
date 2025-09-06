const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin'); // Solo admins pueden registrar gastos
const asyncHandler = require('express-async-handler');

const prisma = new PrismaClient();

// POST /api/expenses - Registrar un nuevo gasto
router.post('/', [authMiddleware, adminMiddleware], asyncHandler(async (req, res) => {
    const { amount, description, bankId } = req.body;
    const userId = req.user.id;

    if (!amount || !description || !bankId) {
        res.status(400);
        throw new Error('El monto, la descripción y el banco son requeridos.');
    }

    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) {
        res.status(400);
        throw new Error('El monto debe ser un número positivo.');
    }

    // Transacción para asegurar que se cree el registro del gasto
    // y se actualice el saldo del banco de forma atómica.
    const expenseTransaction = await prisma.$transaction(async (tx) => {
        // Crear la transacción de tipo "EXPENSE"
        const transaction = await tx.transaction.create({
            data: {
                type: 'EXPENSE',
                amount: parsedAmount,
                description: description,
                bankId: parseInt(bankId)
            }
        });

        // Actualizar (disminuir) el saldo del banco correspondiente
        await tx.bank.update({
            where: { id: parseInt(bankId) },
            data: {
                balance: {
                    decrement: parsedAmount
                }
            }
        });

        return transaction;
    });

    res.status(201).json(expenseTransaction);
}));

// Podríamos añadir una ruta GET para listar todos los gastos en el futuro

module.exports = router;