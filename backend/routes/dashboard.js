// routes/dashboard.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
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


module.exports = router;