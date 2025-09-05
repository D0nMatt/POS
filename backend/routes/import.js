// routes/import.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { PrismaClient } = require('@prisma/client');

const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/products', [authMiddleware, adminMiddleware, upload.single('file')], async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se ha subido ningún archivo.');
    }

    const results = [];
    const stream = Readable.from(req.file.buffer.toString());

    stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                const productsToProcess = results.map(item => ({
                    name: item.name,
                    price: parseFloat(item.price),
                    stock: parseInt(item.stock, 10),
                }));

                for (const product of productsToProcess) {
                    if (!product.name || isNaN(product.price) || isNaN(product.stock)) {
                        throw new Error('El archivo CSV contiene datos inválidos.');
                    }
                }

                // Usamos una transacción para procesar cada producto
                const createdProducts = await prisma.$transaction(async (tx) => {
                    const transactionResults = [];
                    for (const productData of productsToProcess) {
                        const newProduct = await tx.product.upsert({
                            where: { name: productData.name }, // Busca un producto con este nombre
                            update: {}, // Si lo encuentra, no hagas nada (no actualices)
                            create: { // Si no lo encuentra, créalo
                                name: productData.name,
                                price: productData.price,
                                stock: productData.stock,
                            },
                        });
                        transactionResults.push(newProduct);
                    }
                    return transactionResults;
                });
                
                res.status(201).send(`Se han procesado ${productsToProcess.length} productos.`);

            } catch (error) {
                res.status(500).send(`Error al procesar el archivo: ${error.message}`);
            }
        });
});

module.exports = router;