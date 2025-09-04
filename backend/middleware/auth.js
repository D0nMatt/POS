const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Obtener el token del header
  const token = req.header('x-auth-token');

  // 2. Verificar si no hay token
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, permiso no válido' });
  }

  // 3. Validar el token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Guardamos el payload del token en el objeto request
    next(); // Pasamos al siguiente paso
  } catch (err) {
    res.status(401).json({ msg: 'Token no es válido' });
  }
};