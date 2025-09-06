import React, { useState, useEffect, useRef, useContext, memo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import OrderPanel from '../components/OrderPanel';
import { usePosStore } from '../store/posStore';

function PosPage() {
    const { user } = useContext(AuthContext);
    console.log('Usuario en el contexto de PosPage:', user);
    const [tables, setTables] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [products, setProducts] = useState([]);
    const lastClickTime = useRef(0);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const { isPanelOpen, selectedTable, currentOrder, selectTable, addToOrder, removeFromOrder, closePanel } = usePosStore();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tablesRes, productsRes] = await Promise.all([
                    api.get('/tables'),
                    api.get('/products')
                ]);
                setTables(tablesRes.data);
                setProducts(productsRes.data);
            } catch (error) {
                console.error("Error al cargar datos:", error);
            }
        };
        fetchData();
    }, []);

    const handleDragStop = useCallback((e, data, table) => {
        // Si la posición no cambió, fue un clic o doble clic
        if (data.x === table.x && data.y === table.y) {
            const now = new Date().getTime();
            const DOUBLE_CLICK_DELAY = 300; // 300ms

            // Comprueba si el tiempo desde el último clic es corto
            if (now - lastClickTime.current < DOUBLE_CLICK_DELAY) {
                handleDoubleClick(table);
            } else if (!isEditMode) {
                // Si es el primer clic y no estamos en modo edición
                handleTableClick(table);
            }
            // Actualiza la marca de tiempo del último clic
            lastClickTime.current = now;
        } else {
            // Si la posición cambió, fue un arrastre
            api.put(`/tables/${table.id}/layout`, { x: data.x, y: data.y }).catch(console.error);
            setTables(prevTables => prevTables.map(t => (t.id === table.id ? { ...t, x: data.x, y: data.y } : t)));
        }
    }, []);

    const handleResizeStart = () => {
        setIsResizing(true);
    };

    const handleResizeStop = (e, data, table) => {
        setIsResizing(false);
        const { width, height } = data.size;
        api.put(`/tables/${table.id}/layout`, { width, height, x: table.x, y: table.y }).catch(console.error);
        setTables(prevTables => prevTables.map(t => (t.id === table.id ? { ...t, width, height } : t)));
    };

    const handleDoubleClick = (table) => {
        if (!isEditMode) return;
        const newShape = table.shape === 'square' ? 'circle' : 'square';
        setTables(prevTables =>
            prevTables.map(t => (t.id === table.id ? { ...t, shape: newShape } : t))
        );

        // Llama a la API para guardar el cambio permanentemente
        api.put(`/tables/${table.id}/shape`, { shape: newShape }).catch(console.error);
    };

    //Función para manejar el clic en una mesa
    const handleTableClick = async (table) => {
        if (table.status === 'occupied') {
            try {
                const res = await api.get(`/orders/table/${table.id}`);
                const orderItems = res.data ? res.data.items.map(item => ({ ...item.product, quantity: item.quantity })) : [];
                const orderId = res.data ? res.data.id : null;
                selectTable(table, orderItems, orderId);
            } catch (error) {
                console.error("Error al cargar el pedido:", error);
                selectTable(table, [], null);
            }
        } else {
            selectTable(table, [], null);
        }
    };

    const handleAddToOrder = (product) => {
        setCurrentOrder(prevOrder => {
            const existingItem = prevOrder.find(item => item.id === product.id);
            if (existingItem) {
                // Si el producto ya está en el pedido, incrementa la cantidad
                return prevOrder.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            // Si es un producto nuevo, añádelo con cantidad 1
            return [...prevOrder, { ...product, quantity: 1 }];
        });
    };

    const handleRemoveFromOrder = (product) => {
        setCurrentOrder(prevOrder => {
            const existingItem = prevOrder.find(item => item.id === product.id);
            if (existingItem.quantity === 1) {
                // Si solo queda uno, elimínalo de la lista
                return prevOrder.filter(item => item.id !== product.id);
            }
            // Si hay más de uno, decrementa la cantidad
            return prevOrder.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
            );
        });
    };

    const handleSaveChanges = async () => {
        if (!selectedTable) return;
        const orderData = {
            tableId: selectedTable.id,
            items: currentOrder.map(item => ({ productId: item.id, quantity: item.quantity })),
        };
        try {
            const res = await api.post('/orders', orderData);
            setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'occupied' } : t));
            setIsPanelOpen(false);
            alert('Pedido guardado.');
        } catch (error) {
            alert('Error al guardar el pedido.');
        }
    };

    const handleFinalize = async () => {
        if (!currentOrderId) {
            alert('Este pedido aún no se ha guardado. Guarda los cambios primero.');
            return;
        }
        try {
            await api.put(`/orders/${currentOrderId}/finalize`);
            setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'available' } : t));
            setIsPanelOpen(false);
            alert('Mesa liberada. ¡Venta completada!');
        } catch (error) {
            alert('Error al finalizar la venta.');
        }
    };

    const Table = memo(({ table }) => {
        const nodeRef = useRef(null);

        const style = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            cursor: 'grab',
            backgroundColor: table.status === 'available' ? '#90ee90' : '#f08080',
            border: '2px solid #333',
            borderRadius: table.shape === 'circle' ? '50%' : '8px',
            color: 'black',
            width: '100%',
            height: '100%',
        };

        return (
            <Draggable
                nodeRef={nodeRef}
                bounds="parent"
                position={{ x: table.x, y: table.y }}
                onStop={(e, data) => handleDragStop(e, data, table)}
                disabled={!isEditMode || isResizing}
            >
                <div ref={nodeRef} style={{ position: 'absolute' }}>
                    <ResizableBox
                        width={table.width}
                        height={table.height}
                        onResizeStart={handleResizeStart}
                        onResizeStop={(e, data) => handleResizeStop(e, data, table)}
                        resizeHandles={isEditMode ? ['se'] : []}
                        lockAspectRatio={table.shape === 'circle'}
                    >
                        <div style={style} onClick={() => !isEditMode && !isResizing && handleTableClick(table)}>
                            <span>{table.name}</span>
                        </div>
                    </ResizableBox>
                </div>
            </Draggable>
        );
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Punto de Venta</h2>
                {user?.role === 'ADMIN' && (
                    <button onClick={() => setIsEditMode(!isEditMode)}>
                        {isEditMode ? '✓ Guardar Layout' : '✎ Editar Layout'}
                    </button>
                )}
            </div>

            <div style={{ height: '80vh', position: 'relative', border: '1px solid #ccc' }}>
                {tables.map(table => <Table key={table.id} table={table} />)}
            </div>

            {isPanelOpen && (
                <OrderPanel
                    table={selectedTable}
                    products={products}
                    order={currentOrder}
                    onClose={closePanel}
                    onAddToOrder={addToOrder}
                    onRemoveFromOrder={removeFromOrder}
                    onSaveChanges={handleSaveChanges}
                    onFinalize={handleFinalize}
                />
            )}
        </div>
    );
}

export default PosPage;