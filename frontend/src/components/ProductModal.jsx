import React, { useState, useEffect } from 'react';
import api from '../api';

function ProductModal({ productToEdit, onClose, onProductUpdated, onProductCreated }) {
  const [formData, setFormData] = useState({ name: '', price: '', stock: '' });
  const isEditMode = !!productToEdit;

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        name: productToEdit.name,
        price: productToEdit.price,
        stock: productToEdit.stock,
      });
    }
  }, [productToEdit, isEditMode]);

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

  // Estilos básicos para el modal
  const modalStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0, 0, 0, 0.5)', display: 'flex', 
    alignItems: 'center', justifyContent: 'center'
  };
  const contentStyle = { background: 'white', padding: '2rem', borderRadius: '5px' };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <h2>{isEditMode ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
        <form onSubmit={onSubmit}>
          <input name="name" value={formData.name} onChange={onChange} placeholder="Nombre" required />
          <input name="price" type="number" value={formData.price} onChange={onChange} placeholder="Precio" required />
          <input name="stock" type="number" value={formData.stock} onChange={onChange} placeholder="Stock" required />
          <button type="submit">Guardar Cambios</button>
          <button type="button" onClick={onClose}>Cancelar</button>
        </form>
      </div>
    </div>
  );
}

export default ProductModal;