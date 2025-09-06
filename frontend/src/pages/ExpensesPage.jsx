import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
    Container, Typography, Box, Paper, Button, TextField,
    Select, MenuItem, FormControl, InputLabel, Grid
} from '@mui/material';
import AddCardIcon from '@mui/icons-material/AddCard';

function ExpensesPage() {
    const [banks, setBanks] = useState([]);
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        bankId: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const res = await api.get('/banks');
                setBanks(res.data);
            } catch (error) {
                console.error('Error al cargar los bancos:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanks();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegisterExpense = async (e) => {
        e.preventDefault();
        const promise = api.post('/expenses', formData);

        toast.promise(promise, {
            loading: 'Registrando gasto...',
            success: () => {
                // Limpiar el formulario para el siguiente registro
                setFormData({ amount: '', description: '', bankId: '' });
                
                return 'Gasto registrado con éxito.';
            },
            error: (err) => err.response?.data?.message || 'Error al registrar el gasto.',
        });
    };

    if (loading) return <p>Cargando...</p>;

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" sx={{ mb: 2 }}>Registrar Gasto</Typography>
            <Paper sx={{ p: 3 }}>
                <Box component="form" onSubmit={handleRegisterExpense}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Origen del Dinero</InputLabel>
                                <Select
                                    name="bankId"
                                    value={formData.bankId}
                                    label="Origen del Dinero"
                                    onChange={handleChange}
                                >
                                    {banks.map((bank) => (
                                        <MenuItem key={bank.id} value={bank.id}>
                                            {bank.name} (Saldo: ${bank.balance.toFixed(2)})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Descripción del Gasto"
                                value={formData.description}
                                onChange={handleChange}
                                fullWidth
                                required
                                multiline
                                rows={3}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="amount"
                                label="Monto del Gasto"
                                type="number"
                                value={formData.amount}
                                onChange={handleChange}
                                fullWidth
                                required
                                InputProps={{ startAdornment: '$' }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                startIcon={<AddCardIcon />}
                            >
                                Registrar Gasto
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
}

export default ExpensesPage;