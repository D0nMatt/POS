import React from 'react';

function OrderPanel({ table, products, order, onAddToOrder, onClose, onFinalizeSale }) {
  // Estilos para el panel
  const panelStyle = {
    position: 'fixed', top: 0, right: 0, width: '350px', height: '100vh',
    background: '#f4f4f4', borderLeft: '1px solid #ccc',
    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)', padding: '1rem',
    boxSizing: 'border-box', overflowY: 'auto'
  };

  const productListStyle = { listStyle: 'none', padding: 0 };
  const productItemStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' };

  return (
    <div style={panelStyle}>
      <button onClick={onClose} style={{ float: 'right' }}>X</button>
      <h3>Pedido para: {table.name}</h3>
      <hr />
      
      <h4>Menú de Productos</h4>
      <ul style={productListStyle}>
        {products.map(product => (
          <li key={product.id} style={productItemStyle}>
            <span>{product.name} - ${product.price}</span>
            <button onClick={() => onAddToOrder(product)}>+</button>
          </li>
        ))}
      </ul>
      <hr />

      <h4>Pedido Actual</h4>
      {/* Aquí mostraremos los productos añadidos */}
      <p>Total: $0.00</p>
      <button onClick={onFinalizeSale} style={{ width: '100%', padding: '1rem', background: 'green', color: 'white' }}>
        Finalizar Venta
      </button>
    </div>
  );
}

export default OrderPanel;