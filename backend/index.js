require('dotenv').config();
const cors = require('cors');
const http = require('http');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const importRoutes = require('./routes/import');
const tablesRoutes = require('./routes/tables');
const ordersRoutes = require('./routes/orders');
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/admin');
const { errorHandler } = require('./middleware/errorHandler');
const dashboardRoutes = require('./routes/dashboard');
const categoriesRoutes = require('./routes/categories');

const { Server } = require("socket.io");
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');

const app = express();
const prisma = new PrismaClient();
const server = http.createServer(app); // Creamos un servidor HTTP a partir de la app de Express
const io = new Server(server, { // Inicializamos socket.io
    cors: {
        origin: "http://localhost:3001", // Reemplaza con la URL de tu frontend
        methods: ["GET", "POST"]
    }
});


// Middlewares
app.use(express.json());
app.use(cors());
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/import', importRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
// --- RUTA PARA REGISTRAR USUARIOS ---
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

// --- RUTA PARA INICIAR SESIÓN (LOGIN) ---
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
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error en el servidor');
    }
  }
);

// --- RUTA PROTEGIDA PARA AÑADIR PRODUCTOS ---
app.post(
  '/api/products',
  [
    authMiddleware,
    adminMiddleware,
    [
      body('name').notEmpty(),
      body('value').isFloat({ gt: 0 }),
      body('cost').isFloat({ gte: 0 }),
      body('categoryId').isInt(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
        name, productType, status, value, cost, stock, 
        minStock, maxStock, categoryId, sku, description, imageUrl, unit 
    } = req.body;

    try {
      const product = await prisma.product.create({
        data: {
          name,
          productType,
          status,
          value,
          cost,
          stock: stock || 0,
          minStock,
          maxStock,
          categoryId,
          sku,
          description,
          imageUrl,
          unit
        }
      });
      res.status(201).json(product);
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(400).json({ msg: `Ya existe un producto con ese ${err.meta.target.includes('name') ? 'nombre' : 'SKU'}.` });
      }
      res.status(500).send('Error en el servidor');
    }
  }
);

// --- RUTA PARA CONSULTAR TODOS LOS PRODUCTOS
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: { 
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (err) {
    res.status(500).send('Error en el servidor');
  }
});

// --- RUTA PARA CONSULTAR UN PRODUCTO
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


// --- RUTA PARA ACTUALIZAR UN PRODUCTO
app.put('/api/products/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { 
        name, productType, status, value, cost, stock, 
        minStock, maxStock, categoryId, sku, description, imageUrl, unit 
    } = req.body;
    
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name, productType, status, value, cost, stock, 
        minStock, maxStock, categoryId, sku, description, imageUrl, unit
      }
    });

    res.json(updatedProduct);
  } catch (err) {
    if (err.code === 'P2002') {
        return res.status(400).json({ msg: `Ya existe un producto con ese ${err.meta.target.includes('name') ? 'nombre' : 'SKU'}.` });
    }
    res.status(500).send('Error en el servidor');
  }
});


// --- RUTA PARA ELIMINAR UN PRODUCTO
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

// --- RUTA PARA REGISTRAR UNA VENTA ---
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

// --- RUTA PARA CONSULTAR TODOS LOS TRABAJADORES ---
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

// --- RUTA PARA EDITAR UN TRABAJADOR (NOMBRE Y EMAIL) ---
app.put('/api/employees/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    const { name, email } = req.body;
    try {
        const employeeId = parseInt(req.params.id);
        const updatedEmployee = await prisma.user.update({
            where: { id: employeeId },
            data: { name, email },
        });
        res.json(updatedEmployee);
    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

// --- RUTA PARA CREAR UN NUEVO TRABAJADOR ---
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

    res.status(201).json(user);

  } catch (err) {
    res.status(500).send('Error en el servidor');
  }
});

// --- RUTA PARA ELIMINAR UN TRABAJADOR ---
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

// --- RUTA PARA INICIAR TURNO (CLOCK IN) ---
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

// --- RUTA PARA FINALIZAR TURNO (CLOCK OUT) ---
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

// --- SOCKETS ---
io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado:', socket.id);

    // Unirse a una "sala" específica por mesa
    socket.on('join_table', (tableId) => {
        socket.join(tableId);
        console.log(`Socket ${socket.id} se unió a la sala de la mesa ${tableId}`);
    });

    socket.on('disconnect', () => {
        console.log('Un cliente se ha desconectado:', socket.id);
    });
});

//Iniciar el Servidor
app.use(errorHandler);
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
