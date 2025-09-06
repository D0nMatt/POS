const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Obtener el pedido abierto de una mesa específica
router.get('/table/:tableId', authMiddleware, async (req, res) => {
    try {
        const order = await prisma.sale.findFirst({
            where: {
                tableId: parseInt(req.params.tableId),
                status: 'PENDING',
            },
            include: { items: { include: { product: true } } },
        });
        res.json(order);
    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

// Crear o actualizar un pedido para una mesa
router.post('/', authMiddleware, async (req, res) => {
    const { tableId, items } = req.body;
    const userId = req.user.id;

    try {
        const txResult = await prisma.$transaction(async (tx) => {
            let totalSaleAmount = 0;
            const productIds = items.map(item => item.productId);
            const products = await tx.product.findMany({ where: { id: { in: productIds } } });

            const updateStockPromises = items.map(item =>
                tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                })
            );

            await Promise.all(updateStockPromises);

            const existingOrder = await tx.sale.findFirst({
                where: { tableId, status: 'PENDING' },
            });

            const sale = await tx.sale.upsert({
                where: { id: existingOrder?.id || -1 },
                update: { total: totalSaleAmount },
                create: { userId, tableId, total: totalSaleAmount, status: 'PENDING' },
            });

            await tx.saleItem.deleteMany({ where: { saleId: sale.id } });
            await tx.saleItem.createMany({
                data: items.map(item => ({
                    saleId: sale.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: products.find(p => p.id === item.productId).price,
                })),
            });

            const stockUpdates = items.map(item =>
                tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                })
            );
            await Promise.all(stockUpdates);

            await tx.table.update({ where: { id: tableId }, data: { status: 'occupied' } });
            return sale;
        });
        res.status(201).json(txResult);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// Finalizar un pedido (marcarlo como pagado)
router.put('/:orderId/finalize', authMiddleware, async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);
        const order = await prisma.sale.findUnique({ where: { id: orderId } });

        if (!order) return res.status(404).json({ msg: 'Pedido no encontrado' });

        const finalizedOrder = await prisma.$transaction(async (tx) => {
            // Marca el pedido como completado
            const updatedOrder = await tx.sale.update({
                where: { id: orderId },
                data: { status: 'COMPLETED' },
            });
            // Libera la mesa
            if (order.tableId) {
                await tx.table.update({
                    where: { id: order.tableId },
                    data: { status: 'available' },
                });
            }
            return updatedOrder;
        });
        res.json(finalizedOrder);
    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

module.exports = router;