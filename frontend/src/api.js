// frontend/src/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Interceptor para AÑADIR el token a cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- INTERCEPTOR PARA MANEJAR ERRORES DE RESPUESTA ---
api.interceptors.response.use(
  // Si la respuesta es exitosa (2xx), simplemente la devuelve.
  (response) => response,
  // Si la respuesta es un error...
  (error) => {
    // Loguea el error completo en la consola del desarrollador.
    console.error('Error de API interceptado:', error.response || error);

    // Extrae el mensaje de error del backend, si existe.
    const errorMessage = error.response?.data?.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.';

    // Muestra una notificación amigable al usuario.
    toast.error(errorMessage);

    // Rechaza la promesa para que los manejadores de error locales (.catch)
    // en los componentes todavía puedan ejecutarse si es necesario.
    return Promise.reject(error);
  }
);

export default api;