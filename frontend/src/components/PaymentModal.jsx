import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField, ToggleButtonGroup, ToggleButton } from '@mui/material';

// Estilo para centrar el modal
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function PaymentModal({ open, onClose, orderTotal, onSubmit }) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);

  useEffect(() => {
    // Calcula el cambio automáticamente cuando el monto pagado o el total cambian
    const paid = parseFloat(amountPaid);
    if (!isNaN(paid) && paid >= orderTotal) {
      setChange(paid - orderTotal);
    } else {
      setChange(0);
    }
  }, [amountPaid, orderTotal]);
  
  // Limpia el estado cuando el modal se cierra/abre
  useEffect(() => {
      if (open) {
          setAmountPaid(orderTotal.toFixed(2));
          setPaymentMethod('CASH');
      }
  }, [open, orderTotal]);

  const handleMethodChange = (event, newMethod) => {
    if (newMethod !== null) {
      setPaymentMethod(newMethod);
      if (newMethod === 'CARD') {
        setAmountPaid(orderTotal.toFixed(2)); // Si es tarjeta, el monto es exacto
      }
    }
  };

  const handleSubmit = () => {
    onSubmit({
      paymentMethod,
      amountPaid: parseFloat(amountPaid),
      changeGiven: change,
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">Procesar Pago</Typography>
        <Typography variant="h4" sx={{ my: 2 }}>
          Total a Pagar: ${orderTotal.toFixed(2)}
        </Typography>
        
        <ToggleButtonGroup
          color="primary"
          value={paymentMethod}
          exclusive
          onChange={handleMethodChange}
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton value="CASH">Efectivo</ToggleButton>
          <ToggleButton value="CARD">Tarjeta</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          label="Monto Recibido"
          type="number"
          fullWidth
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          disabled={paymentMethod === 'CARD'}
          inputProps={{ min: orderTotal }}
        />

        <Typography variant="h5" sx={{ mt: 2 }}>
          Cambio: ${change.toFixed(2)}
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" onClick={onClose}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={parseFloat(amountPaid) < orderTotal}
          >
            Confirmar Pago
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default PaymentModal;