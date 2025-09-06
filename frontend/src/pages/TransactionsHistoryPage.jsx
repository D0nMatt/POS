import React, { useState, useEffect } from 'react';
import api from '../api';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Box, Chip
} from '@mui/material';

function TransactionsHistoryPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await api.get('/transactions');
                setTransactions(res.data);
            } catch (error) {
                console.error('Error al cargar las transacciones:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    const getTransactionTypeChip = (type) => {
        switch (type) {
            case 'SALE':
                return <Chip label="Venta" color="success" size="small" />;
            case 'EXPENSE':
                return <Chip label="Gasto" color="error" size="small" />;
            case 'OPENING_SHIFT':
                return <Chip label="Apertura" color="info" size="small" />;
            case 'CLOSING_SHIFT':
                 return <Chip label="Cierre" color="warning" size="small" />;
            default:
                return <Chip label={type} size="small" />;
        }
    };
    
    const formatAmount = (type, amount) => {
        const isIncome = ['SALE', 'OPENING_SHIFT'].includes(type);
        const isOutcome = ['EXPENSE', 'CLOSING_SHIFT'].includes(type);
        
        let formattedAmount = `$${Math.abs(amount).toFixed(2)}`;
        let color = 'text.primary';

        if (isIncome) {
            color = 'success.main';
        } else if (isOutcome) {
            color = 'error.main';
            formattedAmount = `-${formattedAmount}`;
        }

        return <Typography variant="body2" color={color} sx={{ fontWeight: 'bold' }}>{formattedAmount}</Typography>;
    };


    if (loading) return <p>Cargando historial de transacciones...</p>;

    return (
        <Container>
            <Typography variant="h4" sx={{ mb: 2 }}>Historial de Transacciones</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell>Banco/Caja</TableCell>
                            <TableCell align="center">Tipo</TableCell>
                            <TableCell align="right">Monto</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell>{tx.bank.name}</TableCell>
                                <TableCell align="center">{getTransactionTypeChip(tx.type)}</TableCell>
                                <TableCell align="right">{formatAmount(tx.type, tx.amount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
}

export default TransactionsHistoryPage;