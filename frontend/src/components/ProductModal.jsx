import React, { useState, useEffect } from 'react';
import api from '../api';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

function ProductModal({ open, productToEdit, onClose, onProductUpdated, onProductCreated }) {
  const [formData, setFormData] = useState({ name: '', price: '', stock: '' });
  const isEditMode = !!productToEdit;

  useEffect(() => {
    if (isEditMode && productToEdit) {
      setFormData({
        name: productToEdit.name,
        price: productToEdit.price,
        stock: productToEdit.stock,
      });
    } else {
      setFormData({ name: '', price: '', stock: '' });
    }
  }, [productToEdit, isEditMode, open]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
    };
    try {
      if (isEditMode) {
        const res = await api.put(`/products/${productToEdit.id}`, productData);
        onProductUpdated(res.data);
      } else {
        const res = await api.post('/products', productData);
        onProductCreated(res.data);
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      alert('No se pudo guardar el producto.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{isEditMode ? 'Editar Producto' : 'Crear Nuevo Producto'}</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" name="name" label="Nombre del Producto" type="text" fullWidth variant="standard" value={formData.name} onChange={onChange} required />
        <TextField margin="dense" name="price" label="Precio" type="number" fullWidth variant="standard" value={formData.price} onChange={onChange} required />
        <TextField margin="dense" name="stock" label="Stock" type="number" fullWidth variant="standard" value={formData.stock} onChange={onChange} required />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onSubmit}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProductModal;