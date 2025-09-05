import React, { useState, useEffect } from 'react';
import api from '../api';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <h2>Gestión de Productos</h2>
      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <ul>
          {products.map((product) => (
            <li key={product.id}>
              {product.name} - Precio: ${product.price} - Stock: {product.stock}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProductsPage;