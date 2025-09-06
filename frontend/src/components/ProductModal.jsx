import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField,
    Select, MenuItem, FormControl, InputLabel, Grid
} from '@mui/material';

function ProductModal({ open, onClose, productToEdit, onProductCreated, onProductUpdated }) {
    const [formData, setFormData] = useState({
        name: '',
        value: '',
        cost: '',
        stock: '',
        categoryId: '',
        productType: 'PRODUCTO',
        status: 'ACTIVO',
        sku: '',
        minStock: '',
        maxStock: '',
    });
    const [categories, setCategories] = useState([]);

    // Efecto para cargar las categorías desde la API
    useEffect(() => {
        const fetchCategories = async () => {
            if (open) { // Solo busca las categorías si el modal está abierto
                try {
                    const res = await api.get('/categories');
                    setCategories(res.data);
                } catch (error) {
                    toast.error("No se pudieron cargar las categorías.");
                }
            }
        };
        fetchCategories();
    }, [open]);

    // Efecto para rellenar el formulario si estamos editando un producto
    useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name || '',
                value: productToEdit.value || '',
                cost: productToEdit.cost || '',
                stock: productToEdit.stock || '',
                categoryId: productToEdit.categoryId || '',
                productType: productToEdit.productType || 'PRODUCTO',
                status: productToEdit.status || 'ACTIVO',
                sku: productToEdit.sku || '',
                minStock: productToEdit.minStock || '',
                maxStock: productToEdit.maxStock || '',
            });
        } else {
            // Resetea el formulario si estamos creando uno nuevo
            setFormData({
                name: '', value: '', cost: '', stock: '', categoryId: '',
                productType: 'PRODUCTO', status: 'ACTIVO', sku: '',
                minStock: '', maxStock: '',
            });
        }
    }, [productToEdit, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Convertir valores numéricos
        const submissionData = {
            ...formData,
            value: parseFloat(formData.value),
            cost: parseFloat(formData.cost),
            stock: parseInt(formData.stock, 10),
            minStock: formData.minStock ? parseInt(formData.minStock, 10) : null,
            maxStock: formData.maxStock ? parseInt(formData.maxStock, 10) : null,
        };

        const promise = productToEdit
            ? api.put(`/products/${productToEdit.id}`, submissionData)
            : api.post('/products', submissionData);

        toast.promise(promise, {
            loading: productToEdit ? 'Actualizando producto...' : 'Creando producto...',
            success: (res) => {
                if (productToEdit) {
                    onProductUpdated(res.data);
                } else {
                    onProductCreated(res.data);
                }
                onClose();
                return `Producto ${productToEdit ? 'actualizado' : 'creado'} con éxito.`;
            },
            error: (err) => err.response?.data?.msg || 'Ocurrió un error.',
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{productToEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Fila 1 */}
                    <Grid item xs={12} sm={8}>
                        <TextField name="name" label="Nombre del Producto" value={formData.name} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                         <FormControl fullWidth required>
                            <InputLabel>Categoría</InputLabel>
                            <Select name="categoryId" value={formData.categoryId} label="Categoría" onChange={handleChange}>
                                {categories.map(cat => (
                                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Fila 2 */}
                    <Grid item xs={6} sm={4}>
                        <TextField name="value" label="Valor (Precio Venta)" type="number" value={formData.value} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <TextField name="cost" label="Costo" type="number" value={formData.cost} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField name="stock" label="Stock Actual" type="number" value={formData.stock} onChange={handleChange} fullWidth required />
                    </Grid>

                    {/* Fila 3 */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo de Producto</InputLabel>
                            <Select name="productType" value={formData.productType} label="Tipo de Producto" onChange={handleChange}>
                                <MenuItem value="PRODUCTO">Producto</MenuItem>
                                <MenuItem value="CONSUMIBLE">Consumible</MenuItem>
                                <MenuItem value="SERVICIO">Servicio</MenuItem>
                                <MenuItem value="ADICION">Adición</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                         <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select name="status" value={formData.status} label="Estado" onChange={handleChange}>
                                <MenuItem value="ACTIVO">Activo</MenuItem>
                                <MenuItem value="INACTIVO">Inactivo</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Fila 4 (Opcionales) */}
                     <Grid item xs={12} sm={4}>
                        <TextField name="sku" label="SKU (Opcional)" value={formData.sku} onChange={handleChange} fullWidth />
                    </Grid>
                     <Grid item xs={6} sm={4}>
                        <TextField name="minStock" label="Stock Mínimo" type="number" value={formData.minStock} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <TextField name="maxStock" label="Stock Máximo" type="number" value={formData.maxStock} onChange={handleChange} fullWidth />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
}

export default ProductModal;