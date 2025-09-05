import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { logout } = useContext(AuthContext);

  // Basic styling for the navbar (can be moved to a CSS file later)
  const navStyle = {
    background: '#333',
    color: '#fff',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const linkStyle = {
    color: '#fff',
    textDecoration: 'none',
    margin: '0 1rem'
  };

  return (
    <nav style={navStyle}>
      <div>
        <Link to="/" style={linkStyle}>Dashboard</Link>
        <Link to="/pos" style={linkStyle}>Punto de Venta</Link>
        <div style={{ display: 'inline-block' }}>
          <span style={linkStyle}>Inventario</span>
          
          <Link to="/products" style={{ ...linkStyle, marginLeft: '0.5rem' }}>- Productos</Link>
        </div>
      </div>
      <button onClick={logout}>Cerrar Sesión</button>
    </nav>
  );
}

export default Navbar;