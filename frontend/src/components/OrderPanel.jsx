import React, { useState, useMemo } from 'react';
import { usePosStore } from '../store/posStore';
import {
    Drawer, Box, Typography, List, ListItem, ListItemText, IconButton,
    Button, Divider, TextField, Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

function OrderPanel({ products, onSuccessSave }) {
    const { saveChanges, openPaymentModal, currentOrder, closePanel, selectedTable, addToOrder } = usePosStore();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, products]);

    const popularProducts = useMemo(() => products.slice(0, 6), [products]);
    const total = currentOrder.reduce((sum, item) => sum + item.value * item.quantity, 0);

    return (
        <Drawer anchor="right" open={true} onClose={closePanel}>
            <Box sx={{ width: 400, padding: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Pedido para: {selectedTable.name}</Typography>
                    <IconButton onClick={closePanel}><CloseIcon /></IconButton>
                </Box>
                <Divider sx={{ my: 1 }} />

                {/* Buscador de Productos */}
                <TextField
                    label="Buscar Producto"
                    variant="outlined"
                    size="small"
                    fullWidth
                    autoFocus // El foco se pone aquí automáticamente
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 2 }}
                />
                {/* Productos Populares para acceso rápido */}
                {!searchTerm && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Populares</Typography>
                        <Grid container spacing={1}>
                            {popularProducts.map(p => (
                                <Grid key={p.id}>
                                    <Button variant="outlined" fullWidth onClick={() => addToOrder(p)} sx={{ textTransform: 'none', height: '100%' }}>
                                        {p.name}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                    </Box>
                )}

                {/* Lista de Productos Filtrados */}
                <List sx={{ overflowY: 'auto', height: '25%' }}>
                    {filteredProducts.map(product => (
                        <ListItem key={product.id} secondaryAction={<IconButton edge="end" onClick={() => addToOrder(product)}><AddIcon /></IconButton>}>
                            <ListItemText primary={product.name} secondary={`$${product.value.toFixed(2)}`} />
                        </ListItem>
                    ))}
                </List>

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle1">Pedido Actual</Typography>
                {/* Pedido Actual */}
                <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    {currentOrder.length === 0 && <ListItem><ListItemText primary="Añade productos al pedido." /></ListItem>}
                    {currentOrder.map(item => (
                        <ListItem key={item.id}>
                            <ListItemText primary={`${item.name} (x${item.quantity})`} />
                            <IconButton size="small" onClick={() => removeFromOrder(item)}><RemoveIcon /></IconButton>
                            <Typography sx={{ minWidth: '70px', textAlign: 'right' }}>${(item.value * item.quantity).toFixed(2)}</Typography>
                        </ListItem>
                    ))}
                </List>

                {/* Footer con Total y Acciones */}
                <Box sx={{ mt: 'auto' }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h5" align="right" sx={{ mb: 2 }}>Total: ${total.toFixed(2)}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            fullWidth
                            // Llamamos a la acción del store, pasando el callback
                            onClick={() => saveChanges({ onSuccess: onSuccessSave })}
                        >
                            Guardar
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            // Llamamos a la acción del store para abrir el modal
                            onClick={openPaymentModal}
                        >
                            Cobrar
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Drawer>
    );
}

export default OrderPanel;