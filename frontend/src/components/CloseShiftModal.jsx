import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Typography, Box, Grid
} from '@mui/material';

function CloseShiftModal({ open, onClose, onSubmit, activeShift }) {
    const [closingBalance, setClosingBalance] = useState('');

    const handleSubmit = () => {
        if (!closingBalance || isNaN(parseFloat(closingBalance))) {
            // Idealmente, usar un toast de error aquí
            alert('Por favor, introduce un monto válido.');
            return;
        }
        onSubmit(parseFloat(closingBalance));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Cerrar Turno de Caja</DialogTitle>
            <DialogContent>
                <Box sx={{ my: 2 }}>
                    <Typography variant="h6">Resumen del Turno</Typography>
                    <Typography>
                        <strong>Saldo Inicial:</strong> ${activeShift?.openingBalance.toFixed(2)}
                    </Typography>
                    <Typography sx={{ mt: 2 }}>
                        Introduce el monto total contado en la caja para finalizar el turno.
                    </Typography>
                </Box>
                <TextField
                    autoFocus
                    margin="dense"
                    name="closingBalance"
                    label="Monto Final Contado"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(e.target.value)}
                    InputProps={{ startAdornment: '$' }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained">Cerrar Turno</Button>
            </DialogActions>
        </Dialog>
    );
}

export default CloseShiftModal;