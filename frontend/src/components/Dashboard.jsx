import React, { useState, useEffect } from 'react';
import api from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [salesOverTime, setSalesOverTime] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, salesOverTimeRes, topProductsRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/dashboard/sales-over-time'),
                    api.get('/dashboard/top-products')
                ]);
                setStats(statsRes.data);
                setSalesOverTime(salesOverTimeRes.data);
                setTopProducts(topProductsRes.data);
            } catch (error) {
                console.error("Error al cargar los datos del dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Estilos para las tarjetas de estadísticas
    const cardStyle = {
        padding: '1rem',
        borderRadius: '8px',
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        textAlign: 'center',
        minWidth: '200px'
    };

    const cardContainerStyle = {
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem'
    };

    if (loading) {
        return <p>Cargando estadísticas...</p>;
    }

    return (
        <div>
            <h2>Dashboard Principal</h2>

            {/* 1. Tarjetas de Estadísticas */}
            <div style={cardContainerStyle}>
                <div style={cardStyle}>
                    <h4>Ingresos Totales</h4>
                    <p style={{ fontSize: '2rem', margin: 0 }}>${stats?.totalRevenue.toFixed(2)}</p>
                </div>
                <div style={cardStyle}>
                    <h4>Ventas Totales</h4>
                    <p style={{ fontSize: '2rem', margin: 0 }}>{stats?.totalSales}</p>
                </div>
                <div style={cardStyle}>
                    <h4>Productos Vendidos</h4>
                    <p style={{ fontSize: '2rem', margin: 0 }}>{stats?.totalProductsSold}</p>
                </div>
            </div>

            {/* 2. Gráfico de Líneas de Ventas en el Tiempo */}
            <h3>Ventas en el Tiempo</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={salesOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} name="Ingresos" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <hr />
            <h3>Productos Más Vendidos (por unidades)</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="productName" tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => `${value} unidades`} />
                        <Legend />
                        <Bar dataKey="_sum.quantity" fill="#82ca9d" name="Unidades Vendidas" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default Dashboard;