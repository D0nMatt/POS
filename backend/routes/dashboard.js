const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const prisma = new PrismaClient();

// Proteger todas las rutas de este archivo
router.use(authMiddleware, adminMiddleware);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Obtener estadísticas generales (ingresos, ventas, etc.)
 * @access  Private (Admin)
 */
router.get('/stats', async (req, res) => {
    try {
        const totalRevenue = await prisma.sale.aggregate({
            _sum: { total: true },
        });

        const totalSales = await prisma.sale.count();
        
        const totalProductsSold = await prisma.saleItem.aggregate({
            _sum: { quantity: true },
        });

        res.json({
            totalRevenue: totalRevenue._sum.total || 0,
            totalSales,
            totalProductsSold: totalProductsSold._sum.quantity || 0,
        });
    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});


/**
 * @route   GET /api/dashboard/sales-over-time
 * @desc    Obtener datos de ventas agrupados por día
 * @access  Private (Admin)
 */
router.get('/sales-over-time', async (req, res) => {
    try {
        // Esta consulta es más avanzada y específica para SQLite
        const salesByDay = await prisma.$queryRaw`
            SELECT 
                strftime('%Y-%m-%d', "createdAt") as date, 
                SUM("total") as total
            FROM "Sale"
            GROUP BY date
            ORDER BY date ASC
        `;
        res.json(salesByDay);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
});


/**
 * @route   GET /api/dashboard/top-products
 * @desc    Obtener los productos más vendidos
 * @access  Private (Admin)
 */
router.get('/top-products', async (req, res) => {
    try {
        const topProducts = await prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
            },
            _count: {
                productId: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            take: 5, // Top 5 productos
        });

        // Opcional: Añadir detalles del producto a los resultados
        const productIds = topProducts.map(p => p.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
        });

        const enrichedTopProducts = topProducts.map(item => {
            const productDetails = products.find(p => p.id === item.productId);
            return {
                ...item,
                productName: productDetails?.name || 'Producto no encontrado'
            }
        });

        res.json(enrichedTopProducts);
    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

/**
 * @route   GET /api/dashboard/financial-summary
 * @desc    Generar un resumen financiero entre dos fechas
 * @access  Private (Admin)
 */
router.get('/financial-summary', [authMiddleware, adminMiddleware], asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        res.status(400);
        throw new Error('Las fechas de inicio y fin son requeridas.');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    // Aseguramos que la fecha final incluya todo el día
    end.setHours(23, 59, 59, 999);

    // 1. Calcular Ingresos Totales (Ventas)
    const totalSalesResult = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
            type: 'SALE',
            createdAt: { gte: start, lte: end },
        },
    });
    const totalSales = totalSalesResult._sum.amount || 0;

    // 2. Calcular Egresos Totales (Gastos)
    const totalExpensesResult = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
            type: 'EXPENSE',
            createdAt: { gte: start, lte: end },
        },
    });
    const totalExpenses = totalExpensesResult._sum.amount || 0;
    
    // 3. Calcular el Beneficio Neto
    const netProfit = totalSales - totalExpenses;

    // 4. Desglose de ingresos por banco
    const salesByBank = await prisma.transaction.groupBy({
        by: ['bankId'],
        _sum: { amount: true },
        where: {
            type: 'SALE',
            createdAt: { gte: start, lte: end },
        },
    });

    // Para que sea más útil, obtenemos los nombres de los bancos
    const bankIds = salesByBank.map(item => item.bankId);
    const banks = await prisma.bank.findMany({
        where: { id: { in: bankIds } },
        select: { id: true, name: true },
    });
    const bankMap = new Map(banks.map(bank => [bank.id, bank.name]));

    const salesByBankWithName = salesByBank.map(item => ({
        bankName: bankMap.get(item.bankId),
        total: item._sum.amount,
    }));


    res.json({
        totalSales,
        totalExpenses,
        netProfit,
        salesByBank: salesByBankWithName,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
    });
}));

module.exports = router;