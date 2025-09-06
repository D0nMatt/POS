import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const [adminMenuAnchor, setAdminMenuAnchor] = useState(null);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);

    return (
        <AppBar position="static" sx={{ mb: 4 }}>
            <Toolbar>
                <StorefrontIcon sx={{ mr: 1 }} />
                <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
                    Mi Negocio
                </Typography>

                <Box>
                    <Button color="inherit" component={Link} to="/cashier-control">Control de Caja</Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        component={Link}
                        to="/pos"
                        sx={{ mx: 2 }}
                    >
                        Vender
                    </Button>

                    {user?.role === 'ADMIN' && (
                        <>
                            <Button
                                color="inherit"
                                onClick={(e) => setAdminMenuAnchor(e.currentTarget)}
                                endIcon={<ArrowDropDownIcon />}
                            >
                                Administración
                            </Button>
                            <Menu
                                anchorEl={adminMenuAnchor}
                                open={Boolean(adminMenuAnchor)}
                                onClose={() => setAdminMenuAnchor(null)}
                            >
                                <MenuItem component={Link} to="/dashboard" onClick={() => setAdminMenuAnchor(null)}>Dashboard</MenuItem>
                                <MenuItem component={Link} to="/financial-report" onClick={() => setAdminMenuAnchor(null)}>Reporte Financiero</MenuItem>
                                <MenuItem component={Link} to="/transactions-history" onClick={() => setAdminMenuAnchor(null)}>Transacciones</MenuItem>
                                <MenuItem component={Link} to="/products" onClick={() => setAdminMenuAnchor(null)}>Productos</MenuItem>
                                <MenuItem component={Link} to="/categories" onClick={() => setAdminMenuAnchor(null)}>Categorías</MenuItem>
                                <MenuItem component={Link} to="/banks" onClick={() => setAdminMenuAnchor(null)}>Bancos</MenuItem>
                                <MenuItem component={Link} to="/expenses" onClick={() => setAdminMenuAnchor(null)}>Gastos</MenuItem>
                                <MenuItem component={Link} to="/employees" onClick={() => setAdminMenuAnchor(null)}>Empleados</MenuItem>
                            </Menu>
                        </>
                    )}

                    {user && (
                         <>
                            <Button
                                color="inherit"
                                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                                endIcon={<ArrowDropDownIcon />}
                            >
                                Hola, {user.name}
                            </Button>
                            <Menu
                                anchorEl={userMenuAnchor}
                                open={Boolean(userMenuAnchor)}
                                onClose={() => setUserMenuAnchor(null)}
                            >
                                <MenuItem onClick={() => { logout(); setUserMenuAnchor(null); }}>
                                    Cerrar Sesión
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;