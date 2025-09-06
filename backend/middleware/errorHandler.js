const errorHandler = (err, req, res, next) => {
  // Si el error tiene un código de estado, lo usamos; si no, es un 500.
  const statusCode = res.statusCode ? res.statusCode : 500;

  // Logueamos el error completo en la consola del servidor para poder depurar.
  console.error("--- INICIO DE ERROR ---");
  console.error("Ruta:", req.path);
  console.error("Mensaje:", err.message);
  console.error("Stack:", err.stack);
  console.error("--- FIN DE ERROR ---");

  res.status(statusCode);

  // Enviamos una respuesta JSON estandarizada al frontend.
  res.json({
    message: err.message,
    // En desarrollo, podemos enviar el stack del error para facilitar la depuración.
    // En producción, esto debería estar desactivado.
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };