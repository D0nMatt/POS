const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('express-async-handler');

const prisma = new PrismaClient();

// GET /api/shifts/active - Obtener el turno activo actual
router.get('/active', authMiddleware, asyncHandler(async (req, res) => {
    const activeShift = await prisma.cashShift.findFirst({
        where: { status: 'OPEN' },
        include: { user: { select: { name: true } } }
    });
    res.json(activeShift);
}));

// POST /api/shifts/open - Abrir un nuevo turno
router.post('/open', authMiddleware, asyncHandler(async (req, res) => {
    const { openingBalance, cashRegisterBankId } = req.body;
    const userId = req.user.id;

    // Validar que no haya otro turno abierto
    const existingOpenShift = await prisma.cashShift.findFirst({ where: { status: 'OPEN' } });
    if (existingOpenShift) {
        res.status(400);
        throw new Error('Ya existe un turno de caja abierto.');
    }

    if (openingBalance == null || cashRegisterBankId == null) {
        res.status(400);
        throw new Error('El saldo inicial y el ID de la caja son requeridos.');
    }

    // Usamos una transacción para asegurar la consistencia de los datos
    const newShift = await prisma.$transaction(async (tx) => {
        // Crear el turno
        const shift = await tx.cashShift.create({
            data: {
                openingBalance: parseFloat(openingBalance),
                userId,
                status: 'OPEN'
            }
        });

        // Crear la transacción de apertura
        await tx.transaction.create({
            data: {
                type: 'OPENING_SHIFT',
                amount: parseFloat(openingBalance),
                description: `Apertura de turno #${shift.id} por ${req.user.name}`,
                bankId: parseInt(cashRegisterBankId),
                cashShiftId: shift.id,
            }
        });

        // Actualizar el saldo del banco "Caja"
        await tx.bank.update({
            where: { id: parseInt(cashRegisterBankId) },
            data: { balance: { increment: parseFloat(openingBalance) } }
        });

        return shift;
    });

    res.status(201).json(newShift);
}));

// POST /api/shifts/close - Cerrar el turno activo
router.post('/close', authMiddleware, asyncHandler(async (req, res) => {
    const { closingBalance } = req.body; // Dinero contado físicamente por el usuario
    const userId = req.user.id;

    if (closingBalance == null) {
        res.status(400);
        throw new Error('El saldo de cierre es requerido.');
    }

    const parsedClosingBalance = parseFloat(closingBalance);

    const updatedShift = await prisma.$transaction(async (tx) => {
        // Encontrar el turno activo
        const activeShift = await tx.cashShift.findFirst({
            where: { status: 'OPEN' }
        });

        if (!activeShift) {
            res.status(400);
            throw new Error('No hay ningún turno abierto para cerrar.');
        }

        const cashRegister = await tx.bank.findFirst({
            where: { type: 'CASH_REGISTER' }
        });

        if (!cashRegister) {
            res.status(400);
            throw new Error('No se encontró un banco de tipo "Caja" (CASH_REGISTER).');
        }

        // Calcular el total de ventas en efectivo durante este turno
        const cashSales = await tx.transaction.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                cashShiftId: activeShift.id,
                bankId: cashRegister.id,
                type: 'SALE', // Solo transacciones de ventas
            },
        });

        const totalCashSales = cashSales._sum.amount || 0;

        // Calcular los montos finales
        const expectedBalance = activeShift.openingBalance + totalCashSales;
        const difference = parsedClosingBalance - expectedBalance;

        // Actualizar y cerrar el turno
        const closedShift = await tx.cashShift.update({
            where: { id: activeShift.id },
            data: {
                closingBalance: parsedClosingBalance,
                expectedBalance: expectedBalance,
                difference: difference,
                status: 'CLOSED',
                closedAt: new Date(),
            }
        });

        // Crear la transacción de cierre en el banco de la caja
        await tx.transaction.create({
            data: {
                type: 'CLOSING_SHIFT',
                amount: -parsedClosingBalance, // Se registra como un egreso para cuadrar la caja
                description: `Cierre de turno #${closedShift.id}. Saldo contado: $${parsedClosingBalance.toFixed(2)}`,
                bankId: cashRegister.id,
                cashShiftId: closedShift.id,
            }
        });
        
        // Actualizar el saldo del banco "Caja"
        await tx.bank.update({
            where: { id: cashRegister.id },
            data: { balance: { decrement: parsedClosingBalance } }
        });

        return closedShift;
    });

    res.json(updatedShift);
}));

module.exports = router;