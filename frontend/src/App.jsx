import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProductsPage from './pages/ProductsPage';
import PosPage from './pages/PosPage';
import EmployeesPage from './pages/EmployeesPage';
import CategoriesPage from './pages/CategoriesPage';
import BanksPage from './pages/BanksPage';

import CashierControlPage from './pages/CashierControlPage';

function App() {
  const { token, user } = useContext(AuthContext);

  if (!token) {
    // Si no está autenticado, redirigir al login
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        /* Redirige cualquier otra ruta a /login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="cashier-control" element={<CashierControlPage />} />
          {/* Rutas solo para Admin */}
          {user?.role === 'ADMIN' && (
            <>
              <Route path="products" element={<ProductsPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="banks" element={<BanksPage />} />
            </>
          )}
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;