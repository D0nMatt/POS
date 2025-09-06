import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
    Container, Typography, Box, TextField, Button, List,
    ListItem, ListItemText, IconButton, Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (error) {
            toast.error('No se pudieron cargar las categorías.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.error('El nombre no puede estar vacío.');
            return;
        }

        const promise = api.post('/categories', { name: newCategoryName });

        toast.promise(promise, {
            loading: 'Creando categoría...',
            success: (res) => {
                setNewCategoryName('');
                setCategories([...categories, res.data].sort((a, b) => a.name.localeCompare(b.name)));
                return 'Categoría creada con éxito.';
            },
            error: (err) => err.response?.data?.msg || 'Error al crear la categoría.',
        });
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;
        
        const promise = api.delete(`/categories/${categoryId}`);

        toast.promise(promise, {
            loading: 'Eliminando...',
            success: () => {
                setCategories(categories.filter(c => c.id !== categoryId));
                return 'Categoría eliminada.';
            },
            error: (err) => err.response?.data?.msg || 'Error al eliminar.',
        });
    };

    if (loading) return <p>Cargando...</p>;

    return (
        <Container maxWidth="md">
            <Typography variant="h4" sx={{ mb: 2 }}>Gestión de Categorías</Typography>
            
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6">Crear Nueva Categoría</Typography>
                <Box component="form" onSubmit={handleCreateCategory} sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <TextField
                        label="Nombre de la categoría"
                        variant="outlined"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <Button type="submit" variant="contained" startIcon={<AddIcon />}>
                        Crear
                    </Button>
                </Box>
            </Paper>

            <Typography variant="h6">Categorías Existentes</Typography>
            <Paper>
                <List>
                    {categories.map((category) => (
                        <ListItem
                            key={category.id}
                            secondaryAction={
                                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteCategory(category.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText primary={category.name} />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Container>
    );
}

export default CategoriesPage;