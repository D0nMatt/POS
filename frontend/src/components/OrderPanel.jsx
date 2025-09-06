import React from 'react';
import { Drawer, Box, Typography, List, ListItem, ListItemText, IconButton, Button, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

function OrderPanel({ table, products, order, onAddToOrder, onRemoveFromOrder, onClose, onSaveChanges, onFinalize }) {
    const total = order.reduce((sum, item) => sum + item.value * item.quantity, 0);

    return (
        <Drawer anchor="right" open={true} onClose={onClose}>
            <Box sx={{ width: 350, padding: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Pedido para: {table.name}</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle1">Menú</Typography>
                <List sx={{ overflowY: 'auto', maxHeight: '30%' }}>
                    {products.map(product => (
                        <ListItem key={product.id} secondaryAction={<IconButton edge="end" onClick={() => onAddToOrder(product)}><AddIcon /></IconButton>}>
                            <ListItemText primary={product.name} secondary={`$${product.value.toFixed(2)}`} />
                        </ListItem>
                    ))}
                </List>
                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle1">Pedido Actual</Typography>
                <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    {order.length === 0 ? <ListItem><ListItemText primary="Añade productos del menú." /></ListItem> : null}
                    {order.map(item => (
                        <ListItem key={item.id}>
                            <ListItemText primary={`${item.name} (x${item.quantity})`} />
                            <IconButton size="small" onClick={() => onRemoveFromOrder(item)}><RemoveIcon /></IconButton>
                            <Typography sx={{ minWidth: '60px', textAlign: 'right' }}>${(item.value * item.quantity).toFixed(2)}</Typography>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ mt: 'auto' }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h5" align="right" sx={{ mb: 2 }}>Total: ${total.toFixed(2)}</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button variant="contained" color="primary" onClick={onSaveChanges}>Guardar Cambios</Button>
                        <Button variant="contained" color="success" onClick={onFinalize}>Cobrar y Liberar</Button>
                    </Box>
                </Box>
            </Box>
        </Drawer>
    );
}

export default OrderPanel;