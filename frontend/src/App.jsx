import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProductsPage from './pages/ProductsPage';
import PosPage from './pages/PosPage';

function App() {
  const { token } = useContext(AuthContext);

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

  // If authenticated, show pages within the main layout
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="pos" element={<PosPage />} />
      </Route>
      {/* If an authenticated user tries to go anywhere else, redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;