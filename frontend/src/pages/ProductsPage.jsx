import React, { useState, useEffect } from 'react';
import api from '../api';
import ProductModal from '../components/ProductModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import {
    Container, Typography, Button, Box, Paper, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const openDeleteConfirm = (product) => {
        setProductToDelete(product);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async (productId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                await api.delete(`/products/${productId}`);
                // Actualiza la lista de productos después de eliminar
                setProducts(products.filter((p) => p.id !== productId));
            } catch (error) {
                console.error('Error al eliminar el producto:', error);
            }
        }
    };
    
    if (loading) return <p>Cargando...</p>;

    return (
        <Container>
            {/* ... (Encabezado) */}
            {products.length > 0 ? (
                <TableContainer component={Paper}>
                    {/* ... (Tabla de productos) */}
                </TableContainer>
            ) : (
                <Paper sx={{ textAlign: 'center', padding: 4 }}>
                    <InventoryIcon sx={{ fontSize: 48, color: 'grey.500' }} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        No hay productos en tu inventario
                    </Typography>
                    <Typography color="text.secondary">
                        Haz clic en "Crear Producto" para añadir el primero.
                    </Typography>
                </Paper>
            )}
            {/* ... (Modal de producto) */}
            <ConfirmationDialog
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                description={`¿Estás seguro de que quieres eliminar el producto "${productToDelete?.name}"? Esta acción no se puede deshacer.`}
            />
        </Container>
    );
}

export default ProductsPage;