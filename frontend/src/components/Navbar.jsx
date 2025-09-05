import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem } from '@mui/material';

function Navbar({ onToggleEditMode, isEditMode }) {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Sistema POS
                </Typography>

                <Button component={Link} to="/" color="inherit">Dashboard</Button>
                <Button component={Link} to="/pos" color="inherit">Punto de Venta</Button>

                {user?.role === 'ADMIN' && (
                    <>
                        {/*Botón que abre el menú de Inventario */}
                        <Button
                            id="inventory-button"
                            color="inherit"
                            aria-controls={open ? 'inventory-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                            onClick={handleMenuClick}
                        >
                            Inventario
                        </Button>
                        {/*El componente Menu que se muestra u oculta */}
                        <Menu
                            id="inventory-menu"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                            MenuListProps={{ 'aria-labelledby': 'inventory-button' }}
                        >
                            <MenuItem onClick={handleMenuClose} component={Link} to="/products">
                                Productos
                            </MenuItem>
                            {/* Aquí podrías añadir más opciones en el futuro, como "Categorías" o "Proveedores" */}
                        </Menu>

                        <Button component={Link} to="/employees" color="inherit">Empleados</Button>
                    </>
                )}

                <Box sx={{ marginLeft: 'auto' }}>
                    {/* Botón de Cerrar Sesión */}
                    <Button onClick={logout} variant="contained" color="secondary">
                        Cerrar Sesión
                    </Button>
                </Box>

            </Toolbar>
        </AppBar>
    );
}

export default Navbar;