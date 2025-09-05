import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar({ onToggleEditMode, isEditMode }) {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

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
                {user?.role === 'ADMIN' && (
                    <>
                        <div style={{ display: 'inline-block' }}>
                            <span style={linkStyle}>Inventario</span>
                            <Link to="/products" style={{ ...linkStyle, marginLeft: '0.5rem' }}>- Productos</Link>
                        </div>
                        {/* --- NUEVO ENLACE AQUÍ --- */}
                        <Link to="/employees" style={linkStyle}>Empleados</Link>
                    </>
                )}
            </div>
            <div>
                <button onClick={logout} style={{ marginLeft: '1rem' }}>Cerrar Sesión</button>
            </div>
        </nav>
    );
}

export default Navbar;