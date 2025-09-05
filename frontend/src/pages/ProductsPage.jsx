import React, { useState, useEffect } from 'react';
import api from '../api';
import ProductModal from '../components/ProductModal';

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

  return (
    <div>
      <h2>Gestión de Productos</h2>
      <button onClick={handleCreate}>Crear Nuevo Producto</button>
      
      {isModalOpen && (
        <ProductModal
          productToEdit={editingProduct}
          onClose={closeModal}
          onProductCreated={handleProductCreated}
          onProductUpdated={handleProductUpdated}
        />
      )}

      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>${product.price}</td>
                <td>{product.stock}</td>
                <td>
                  <button onClick={() => handleEdit(product)}>Editar</button>
                  <button onClick={() => handleDelete(product.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProductsPage;