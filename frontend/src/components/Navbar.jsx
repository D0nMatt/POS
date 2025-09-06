import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useState, useContext } from 'react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar-main">
      <div className="navbar-section">
        <NavLink to="/dashboard" className="navbar-link">Mi Negocio</NavLink>
      </div>

      <div className="navbar-section">
        <NavLink to="/pos" className="navbar-cta-button">Punto de Venta</NavLink>
        <NavLink to="/cashier-control" className="navbar-link">Control de Caja</NavLink>
        {/* --- Menú de Administración --- */}
        <div
          className="navbar-menu-container"
          onMouseEnter={() => setAdminMenuOpen(true)}
          onMouseLeave={() => setAdminMenuOpen(false)}
        >
          <span className="navbar-link">Administración</span>
          {adminMenuOpen && (
            <div className="navbar-dropdown">
              <NavLink to="/dashboard" className="navbar-dropdown-item">Dashboard</NavLink>
              <NavLink to="/financial-report" className="navbar-dropdown-item">Reporte Financiero</NavLink>
              <NavLink to="/sales-history" className="navbar-dropdown-item">Historial de Ventas</NavLink>
              <NavLink to="/transactions-history" className="navbar-dropdown-item">Transacciones</NavLink>
              <NavLink to="/products" className="navbar-dropdown-item">Productos</NavLink>
              <NavLink to="/categories" className="navbar-dropdown-item">Categorías</NavLink>
              <NavLink to="/banks" className="navbar-dropdown-item">Bancos</NavLink>
              <NavLink to="/expenses" className="navbar-dropdown-item">Gastos</NavLink>
              <NavLink to="/employees" className="navbar-dropdown-item">Empleados</NavLink>
            </div>
          )}
        </div>

        {/* --- Menú de Perfil de Usuario --- */}
        {user && (
          <div
            className="navbar-menu-container"
            onMouseEnter={() => setUserMenuOpen(true)}
            onMouseLeave={() => setUserMenuOpen(false)}
          >
            <div className="navbar-link">
              Hola, {user.name}
            </div>
            {userMenuOpen && (
              <div className="navbar-dropdown">
                <button onClick={handleLogout} className="navbar-dropdown-button">
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;