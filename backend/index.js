// index.js

// 1. Importaciones
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Importamos la librería JWT

// 2. Inicializaciones
const app = express();
const prisma = new PrismaClient();

// 3. Middlewares
app.use(express.json());

// 4. Rutas

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡El servidor del POS está funcionando correctamente!');
});

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


// 5. Iniciar el Servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});