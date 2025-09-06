import React, { useState, useEffect } from 'react';
import api from '../api';
import ProductModal from '../components/ProductModal';
import {
    Container, Typography, Button, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                setProducts(res.data);
            } catch (error) {
                console.error('Error al obtener los productos:', error);
                alert('No se pudieron cargar los productos.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // 4. Función para añadir el nuevo producto a la lista
    const handleCreate = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (productId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                await api.delete(`/products/${productId}`);
                setProducts(products.filter((p) => p.id !== productId));
            } catch (error) {
                console.error('Error al eliminar el producto:', error);
                alert('No se pudo eliminar el producto.');
            }
        }
    };

    const handleProductCreated = (newProduct) => {
        setProducts([newProduct, ...products]);
    };

    const handleProductUpdated = (updatedProduct) => {
        setProducts(
            products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        );
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    if (loading) return <p>Cargando...</p>;

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Gestión de Productos
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                    Crear Producto
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell align="right">Precio</TableCell>
                            <TableCell align="right">Stock</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell align="right">${product.value.toFixed(2)}</TableCell>
                                <TableCell align="right">{product.stock}</TableCell>
                                <TableCell align="center">
                                    <IconButton onClick={() => handleEdit(product)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(product.id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <ProductModal
                open={isModalOpen}
                productToEdit={editingProduct}
                onClose={closeModal}
                onProductCreated={handleProductCreated}
                onProductUpdated={handleProductUpdated}
            />
        </Container>
    );
}

export default ProductsPage;