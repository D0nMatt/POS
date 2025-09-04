// index.js

// 1. Importaciones
const express = require('express');
const { PrismaClient } = require('@prisma/client'); // Importamos el cliente de Prisma
const { body, validationResult } = require('express-validator'); // Importamos herramientas de validación
const bcrypt = require('bcryptjs'); // Importamos bcrypt para hashear contraseñas

// 2. Inicializaciones
const app = express();
const prisma = new PrismaClient(); // Creamos una instancia del cliente de Prisma

// 3. Middlewares
app.use(express.json()); // Le decimos a Express que entienda peticiones con cuerpo en formato JSON

// 4. Rutas

// Ruta de prueba que ya teníamos
app.get('/', (req, res) => {
  res.send('¡El servidor del POS está funcionando correctamente!');
});

// --- NUEVA RUTA PARA REGISTRAR USUARIOS ---
app.post(
  '/api/users',
  [
    // Validaciones
    body('email').isEmail().withMessage('Por favor, introduce un email válido.'),
    body('name').notEmpty().withMessage('El nombre no puede estar vacío.'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  ],
  async (req, res) => {
    // Revisar si hay errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name, password, role } = req.body;

    try {
      // Verificar si el usuario ya existe
      let user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        return res.status(400).json({ msg: 'El usuario ya existe' });
      }

      // Hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Crear el nuevo usuario en la base de datos
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role, // Opcional, por defecto será 'WORKER'
        },
      });

      // Por ahora no devolveremos un token, solo un mensaje de éxito
      res.status(201).json({ msg: 'Usuario registrado exitosamente', userId: user.id });

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