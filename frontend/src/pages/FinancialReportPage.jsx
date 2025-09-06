import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
    Container, Typography, Box, Paper, Button, Grid, TextField
} from '@mui/material';

function FinancialReportPage() {
    const [reportData, setReportData] = useState(null);
    const [dates, setDates] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);

    const handleDateChange = (e) => {
        setDates({ ...dates, [e.target.name]: e.target.value });
    };

    const generateReport = async () => {
        setLoading(true);
        setReportData(null);
        try {
            const res = await api.get('/dashboard/financial-summary', {
                params: dates,
            });
            setReportData(res.data);
        } catch (error) {
            // El interceptor ya maneja el toast de error
            console.error('Error al generar el reporte:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Typography variant="h4" sx={{ mb: 2 }}>Reporte Financiero</Typography>
            
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                        <TextField
                            name="startDate"
                            label="Fecha de Inicio"
                            type="date"
                            value={dates.startDate}
                            onChange={handleDateChange}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                        <TextField
                            name="endDate"
                            label="Fecha de Fin"
                            type="date"
                            value={dates.endDate}
                            onChange={handleDateChange}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button onClick={generateReport} variant="contained" fullWidth disabled={loading}>
                            {loading ? 'Generando...' : 'Generar'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {reportData && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Resultados del {new Date(reportData.startDate).toLocaleDateString()} al {new Date(reportData.endDate).toLocaleDateString()}
                    </Typography>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
                                <Typography variant="h6">Ingresos Totales (Ventas)</Typography>
                                <Typography variant="h4" color="success.main">${reportData.totalSales.toFixed(2)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#ffebee' }}>
                                <Typography variant="h6">Egresos Totales (Gastos)</Typography>
                                <Typography variant="h4" color="error.main">${reportData.totalExpenses.toFixed(2)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                                <Typography variant="h6">Beneficio Neto</Typography>
                                <Typography variant="h4" color="primary.main">${reportData.netProfit.toFixed(2)}</Typography>
                            </Paper>
                        </Grid>
                         <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2 }}>Desglose de Ingresos por Banco</Typography>
                            {reportData.salesByBank.map(bank => (
                                <Box key={bank.bankName} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography>{bank.bankName}</Typography>
                                    <Typography fontWeight="bold">${bank.total.toFixed(2)}</Typography>
                                </Box>
                            ))}
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Container>
    );
}

export default FinancialReportPage;