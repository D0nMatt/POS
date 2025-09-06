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
        <NavLink to="/pos" className="navbar-cta-button">Vender</NavLink>
      </div>

      <div className="navbar-section">
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
              <NavLink to="/products" className="navbar-dropdown-item">Productos</NavLink>
              <NavLink to="/categories" className="navbar-dropdown-item">Categorías</NavLink>
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