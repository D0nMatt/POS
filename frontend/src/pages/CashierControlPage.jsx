import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import {
    Container, Typography, Box, Paper, Button, TextField,
    Select, MenuItem, FormControl, InputLabel, CircularProgress, Grid
} from '@mui/material';
import CloseShiftModal from '../components/CloseShiftModal';

function CashierControlPage() {
    const { user } = useContext(AuthContext);
    const [activeShift, setActiveShift] = useState(null);
    const [cashRegisters, setCashRegisters] = useState([]);
    const [selectedRegisterId, setSelectedRegisterId] = useState('');
    const [openingBalance, setOpeningBalance] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCloseModalOpen, setCloseModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            // Dos peticiones en paralelo para más eficiencia
            const [shiftRes, banksRes] = await Promise.all([
                api.get('/shifts/active'),
                api.get('/banks')
            ]);

            setActiveShift(shiftRes.data);

            // Filtramos solo los bancos que son cajas registradoras
            const registers = banksRes.data.filter(bank => bank.type === 'CASH_REGISTER');
            setCashRegisters(registers);

            // Si solo hay una caja, la seleccionamos por defecto
            if (registers.length === 1) {
                setSelectedRegisterId(registers[0].id);
            }

        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenShift = async (e) => {
        e.preventDefault();
        const promise = api.post('/shifts/open', {
            openingBalance: parseFloat(openingBalance),
            cashRegisterBankId: selectedRegisterId,
        });

        toast.promise(promise, {
            loading: 'Abriendo turno...',
            success: () => {
                fetchData(); // Recargamos los datos para mostrar el turno activo
                setOpeningBalance('');
                return 'Turno abierto con éxito.';
            },
            error: (err) => err.response?.data?.message || 'Error al abrir el turno.',
        });
    };

    const handleCloseShift = async (closingBalance) => {
        const promise = api.post('/shifts/close', { closingBalance });

        toast.promise(promise, {
            loading: 'Cerrando turno...',
            success: (res) => {
                const { difference } = res.data;
                let resultMessage = 'Turno cerrado con éxito. ';
                if (difference > 0) {
                    resultMessage += `¡Hubo un sobrante de $${difference.toFixed(2)}!`;
                } else if (difference < 0) {
                    resultMessage += `Hubo un faltante de $${Math.abs(difference).toFixed(2)}.`;
                } else {
                    resultMessage += 'El conteo cuadró perfectamente.';
                }

                setCloseModalOpen(false);
                fetchData(); // Recargamos los datos para mostrar la vista de "Abrir Turno"
                return resultMessage;
            },
            error: (err) => err.response?.data?.message || 'Error al cerrar el turno.',
        });
    };

    if (loading) {
        return <Container sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Container>;
    }

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" sx={{ mb: 2, textAlign: 'center' }}>Control de Caja</Typography>

            {activeShift ? (
                // --- VISTA CUANDO HAY UN TURNO ACTIVO ---
                <Paper sx={{ p: 3, mt: 2 }}>
                    <Typography variant="h5" color="green" gutterBottom>Turno Abierto</Typography>
                    <Typography><strong>Abierto por:</strong> {activeShift.user.name}</Typography>
                    <Typography><strong>Fecha de Apertura:</strong> {new Date(activeShift.openedAt).toLocaleString()}</Typography>
                    <Typography><strong>Saldo Inicial:</strong> ${activeShift.openingBalance.toFixed(2)}</Typography>
                    <Button variant="contained" color="error" fullWidth sx={{ mt: 3 }} onClick={() => setCloseModalOpen(true)}>
                        Cerrar Turno
                    </Button>
                </Paper>
            ) : (
                // --- VISTA PARA ABRIR UN NUEVO TURNO ---
                <Paper sx={{ p: 3, mt: 2 }}>
                    <Typography variant="h5" gutterBottom>Abrir Nuevo Turno</Typography>
                    <Box component="form" onSubmit={handleOpenShift}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Seleccionar Caja</InputLabel>
                                    <Select
                                        value={selectedRegisterId}
                                        label="Seleccionar Caja"
                                        onChange={(e) => setSelectedRegisterId(e.target.value)}
                                    >
                                        {cashRegisters.map(reg => (
                                            <MenuItem key={reg.id} value={reg.id}>{reg.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Saldo Inicial en Caja"
                                    type="number"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                    fullWidth
                                    required
                                    InputProps={{ startAdornment: '$' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button type="submit" variant="contained" fullWidth size="large">
                                    Abrir Turno
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            )}
            {/* Renderizar el modal */}
            {activeShift && (
                <CloseShiftModal
                    open={isCloseModalOpen}
                    onClose={() => setCloseModalOpen(false)}
                    onSubmit={handleCloseShift}
                    activeShift={activeShift}
                />
            )}
        </Container>
    );
}

export default CashierControlPage;