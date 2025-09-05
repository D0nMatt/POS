import React from 'react';

function OrderPanel({ table, products, order, onAddToOrder, onRemoveFromOrder, onClose, onSaveChanges, onFinalize }) {
    const total = order.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
            {order.length === 0 ? (
                <p>Añade productos del menú.</p>
            ) : (
                <ul style={productListStyle}>
                    {order.map(item => (
                        <li key={item.id} style={productItemStyle}>
                            <span>{item.name} (x{item.quantity})</span>
                            <span>
                                ${(item.price * item.quantity).toFixed(2)}
                                <button onClick={() => onRemoveFromOrder(item)} style={{ marginLeft: '10px' }}>-</button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            <hr />
            <h3>Total: ${total.toFixed(2)}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button onClick={onSaveChanges} style={{ padding: '0.8rem', background: '#007bff', color: 'white' }}>
                    Guardar Cambios
                </button>
                <button onClick={onFinalize} disabled={order.length === 0} style={{ padding: '0.8rem', background: '#28a745', color: 'white' }}>
                    Cobrar y Liberar Mesa
                </button>
            </div>
        </div>
    );
}

export default OrderPanel;