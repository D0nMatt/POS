import React from 'react'; // Necesario para que React entienda el JSX
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Para el sistema de rutas
import { AuthProvider } from './context/AuthContext.jsx'; // Para el estado de autenticación
import App from './App.jsx';
import axios from 'axios';
import './index.css';

axios.defaults.baseURL = 'http://localhost:3001/api';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);