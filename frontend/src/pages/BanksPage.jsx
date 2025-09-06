import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
    Container, Typography, Box, TextField, Button, List,
    ListItem, ListItemText, Paper, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function BanksPage() {
    const [banks, setBanks] = useState([]);
    const [formData, setFormData] = useState({ name: '', type: '', balance: '0' });
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchBanks();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateBank = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.type.trim()) {
            toast.error('El nombre y el tipo son requeridos.');
            return;
        }

        const promise = api.post('/banks', formData);
        toast.promise(promise, {
            loading: 'Creando banco...',
            success: () => {
                setFormData({ name: '', type: '', balance: '0' });
                fetchBanks(); // Recarga
                return 'Banco creado con éxito.';
            },
            error: (err) => err.response?.data?.message || 'Error al crear el banco.',
        });
    };

    if (loading) return <p>Cargando bancos...</p>;

    return (
        <Container maxWidth="md">
            <Typography variant="h4" sx={{ mb: 2 }}>Gestión de Bancos y Cajas</Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6">Crear Nuevo Banco/Caja</Typography>
                <Box component="form" onSubmit={handleCreateBank} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 2, mt: 1, alignItems: 'center' }}>
                    <TextField name="name" label="Nombre (Ej: Caja 1)" value={formData.name} onChange={handleChange} size="small" required />
                    <FormControl size="small" required>
                        <InputLabel>Tipo</InputLabel>
                        <Select name="type" value={formData.type} label="Tipo" onChange={handleChange}>
                            <MenuItem value="CASH_REGISTER">Caja (Efectivo)</MenuItem>
                            <MenuItem value="BANK_ACCOUNT">Cuenta Bancaria</MenuItem>
                            <MenuItem value="SAFE">Caja Fuerte</MenuItem>
                        </Select>
                    </FormControl>
                    <Button type="submit" variant="contained" startIcon={<AddIcon />}>Crear</Button>
                </Box>
            </Paper>

            <Typography variant="h6">Bancos Existentes</Typography>
            <Paper>
                <List>
                    {banks.map((bank) => (
                        <ListItem key={bank.id}>
                            <ListItemText 
                                primary={bank.name} 
                                secondary={`Tipo: ${bank.type} - Saldo: $${bank.balance.toFixed(2)}`} 
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Container>
    );
}

export default BanksPage;