// index.js

// 1. Importaciones
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/admin');
const dashboardRoutes = require('./routes/dashboard');
const importRoutes = require('./routes/import');

// 2. Inicializaciones
const app = express();
const prisma = new PrismaClient();

// 3. Middlewares
app.use(express.json());
app.use(cors());
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/import', importRoutes);

// 4. Rutas
// Ruta para registrar usuarios
app.post(
  '/api/users',
  [
    body('email').isEmail().withMessage('Por favor, introduce un email válido.'),
    body('name').notEmpty().withMessage('El nombre no puede estar vacío.'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name, password, role } = req.body;

    try {
      let user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        return res.status(400).json({ msg: 'El usuario ya existe' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = await prisma.user.create({
        data: { email, name, password: hashedPassword, role },
      });

      res.status(201).json({ msg: 'Usuario registrado exitosamente', userId: user.id });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error en el servidor');
    }
  }
);

// --- NUEVA RUTA PARA INICIAR SESIÓN (LOGIN) ---
app.post(
  '/api/auth/login',
  [
    body('email').isEmail().withMessage('Por favor, introduce un email válido.'),
    body('password').exists().withMessage('La contraseña es requerida.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // 1. Verificar si el usuario existe
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({ msg: 'Credenciales inválidas' });
      }

      // 2. Comparar la contraseña enviada con la de la base de datos
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Credenciales inválidas' });
      }

      // 3. Si todo es correcto, crear el JWT
      const payload = {
        user: {
          id: user.id,
          role: user.role, // Incluimos el rol en el token
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET, // Usamos el secreto del archivo .env
        { expiresIn: '5h' }, // El token expirará en 5 horas
        (err, token) => {
          if (err) throw err;
          res.json({ token }); // Enviamos el token al cliente
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error en el servidor');
    }
  }
);

// --- NUEVA RUTA PROTEGIDA PARA AÑADIR PRODUCTOS ---
app.post(
  '/api/products',
  [
    authMiddleware, // ¡Aquí está nuestro guardia de seguridad!
    [
      // Validaciones para los datos del producto
      body('name').notEmpty().withMessage('El nombre es requerido'),
      body('price').isFloat({ gt: 0 }).withMessage('El precio debe ser un número positivo'),
      body('stock').isInt({ gt: -1 }).withMessage('El stock debe ser un número entero no negativo'),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, price, stock } = req.body;

    try {
        // Verificar si ya existe un producto con el mismo nombre
        const productExists = await prisma.product.findUnique({ where: { name }});
        if (productExists) {
            return res.status(400).json({ msg: 'Ya existe un producto con ese nombre' });
        }

        // Crear el nuevo producto
        const product = await prisma.product.create({
            data: {
                name,
                price,
                stock,
            }
        });

        res.status(201).json(product);

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error en el servidor');
    }
  }
);

// --- NUEVA RUTA PARA CONSULTAR TODOS LOS PRODUCTOS
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' } // Opcional: muestra los más nuevos primero
    });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// --- NUEVA RUTA PARA CONSULTAR UN PRODUCTO
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!product) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});


// --- NUEVA RUTA PARA ACTUALIZAR UN PRODUCTO
app.put('/api/products/:id', authMiddleware, async (req, res) => {
    const { name, price, stock } = req.body;
    try {
        let product = await prisma.product.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!product) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }
        
        product = await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: { name, price, stock }
        });

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});


// --- NUEVA RUTA PARA ELIMINAR UN PRODUCTO
app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!product) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }

        await prisma.product.delete({
            where: { id: parseInt(req.params.id) }
        });

        res.json({ msg: 'Producto eliminado' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});

// --- NUEVA RUTA PARA REGISTRAR UNA VENTA ---
app.post(
  '/api/sales',
  [
    authMiddleware,
    [
      body('items').isArray({ min: 1 }).withMessage('El carrito no puede estar vacío'),
      body('items.*.productId').isInt().withMessage('El ID del producto debe ser un número'),
      body('items.*.quantity').isInt({ gt: 0 }).withMessage('La cantidad debe ser mayor que cero'),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // El 'carrito' que envía el cliente. Ejemplo: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }]
    const { items } = req.body;
    const userId = req.user.id; // Obtenemos el ID del usuario logueado desde el token

    try {
      // Usamos una transacción para asegurar que todas las operaciones se completen o ninguna lo haga.
      const newSale = await prisma.$transaction(async (tx) => {
        let totalSaleAmount = 0;
        const saleItemsData = [];

        // 1. Verificar stock y calcular el total
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Producto con ID ${item.productId} no encontrado.`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Stock insuficiente para ${product.name}.`);
          }

          totalSaleAmount += product.price * item.quantity;
          saleItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price, // Guardamos el precio al momento de la venta
          });
        }

        // 2. Crear el registro de la venta
        const sale = await tx.sale.create({
          data: {
            userId,
            total: totalSaleAmount,
          },
        });

        // 3. Crear los registros de los items de la venta
        await tx.saleItem.createMany({
          data: saleItemsData.map(item => ({ ...item, saleId: sale.id })),
        });

        // 4. Actualizar el stock de los productos
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
        
        return sale;
      });

      res.status(201).json({ msg: 'Venta registrada exitosamente', sale: newSale });

    } catch (err) {
      // Si la transacción falla por cualquier motivo (ej. stock insuficiente), se revierte todo.
      console.error(err.message);
      res.status(400).json({ msg: err.message });
    }
  }
);

// --- NUEVA RUTA PARA CONSULTAR TODOS LOS TRABAJADORES ---
app.get('/api/employees', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const employees = await prisma.user.findMany({
            where: { role: 'WORKER' },
            select: { id: true, name: true, email: true, createdAt: true }
        });
        res.json(employees);
    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

// --- NUEVA RUTA PARA CREAR UN NUEVO TRABAJADOR ---
app.post('/api/employees', [authMiddleware, adminMiddleware, [
    body('email').isEmail(),
    body('name').notEmpty(),
    body('password').isLength({ min: 6 })
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name, password } = req.body;

    try {
        let user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            return res.status(400).json({ msg: 'Un usuario ya existe con ese email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'WORKER', // Se crea explícitamente como trabajador
            },
        });

        res.status(201).json({ id: user.id, name: user.name, email: user.email });

    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

// --- NUEVA RUTA PARA ELIMINAR UN TRABAJADOR ---
app.delete('/api/employees/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const employeeId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({ where: { id: employeeId } });

        if (!user || user.role !== 'WORKER') {
            return res.status(404).json({ msg: 'Empleado no encontrado' });
        }

        // Aquí podrías añadir lógica para reasignar ventas antes de borrar, pero por ahora lo eliminamos directamente.
        await prisma.user.delete({ where: { id: employeeId } });

        res.json({ msg: 'Empleado eliminado correctamente' });
    } catch (err) {
        // Manejar el caso en que el empleado tenga ventas asociadas
        if (err.code === 'P2003') {
            return res.status(400).json({ msg: 'No se puede eliminar el empleado porque tiene ventas registradas.' });
        }
        res.status(500).send('Error en el servidor');
    }
});

// Iniciar turno (Clock In)
app.post('/api/timeclock/in', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        // Verificar si ya hay un turno abierto (sin clockOut)
        const openShift = await prisma.timeClock.findFirst({
            where: {
                userId: userId,
                clockOut: null
            }
        });

        if (openShift) {
            return res.status(400).json({ msg: 'Ya tienes un turno iniciado.' });
        }

        // Crear el nuevo registro de inicio de turno
        const newClockIn = await prisma.timeClock.create({
            data: {
                userId: userId,
                clockIn: new Date() // Guarda la hora actual del servidor
            }
        });

        res.status(201).json({ msg: 'Turno iniciado correctamente.', data: newClockIn });

    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

// Finalizar turno (Clock Out)
app.post('/api/timeclock/out', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        // Buscar el turno abierto del usuario
        const openShift = await prisma.timeClock.findFirst({
            where: {
                userId: userId,
                clockOut: null
            }
        });

        if (!openShift) {
            return res.status(400).json({ msg: 'No tienes ningún turno activo para finalizar.' });
        }

        // Actualizar el registro con la hora de finalización
        const finishedShift = await prisma.timeClock.update({
            where: {
                id: openShift.id
            },
            data: {
                clockOut: new Date()
            }
        });

        res.json({ msg: 'Turno finalizado correctamente.', data: finishedShift });

    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

// 5. Iniciar el Servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
}); 