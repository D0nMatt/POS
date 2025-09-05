import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProductsPage from './pages/ProductsPage';
import PosPage from './pages/PosPage';
import EmployeesPage from './pages/EmployeesPage';

function App() {
  const { token, user } = useContext(AuthContext);

  if (!token) {
    // If not authenticated, only show the login page
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Redirect any other path to /login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<PosPage />} />

        {/* Rutas solo para Admin */}
        {user?.role === 'ADMIN' && (
          <>
            <Route path="products" element={<ProductsPage />} />
            <Route path="employees" element={<EmployeesPage />} /> {/* 2. Añade la nueva ruta */}
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;