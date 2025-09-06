import React, { useState, useEffect, useRef, useContext, useCallback, memo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import OrderPanel from '../components/OrderPanel';
import { usePosStore } from '../store/posStore';
import toast from 'react-hot-toast';

const TableComponent = memo(({ table, onDragStop, onResizeStop, onDoubleClick, onClick, isEditMode, isResizing }) => {
    const nodeRef = useRef(null);

    const style = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        cursor: isEditMode ? 'grab' : 'pointer',
        backgroundColor: table.status === 'available' ? '#90ee90' : '#f08080',
        border: '2px solid #333',
        borderRadius: table.shape === 'circle' ? '50%' : '8px',
        color: 'black',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            bounds="parent"
            position={{ x: table.x, y: table.y }}
            onStop={(e, data) => onDragStop(e, data, table)}
            disabled={!isEditMode || isResizing}
        >
            <div ref={nodeRef} style={{ position: 'absolute' }} onDoubleClick={() => onDoubleClick(table)}>
                <ResizableBox
                    width={table.width}
                    height={table.height}
                    onResizeStart={(e) => { e.stopPropagation(); onResizeStop.start(); }}
                    onResizeStop={(e, data) => { e.stopPropagation(); onResizeStop.stop(e, data, table); }}
                    resizeHandles={isEditMode ? ['se'] : []}
                    lockAspectRatio={table.shape === 'circle'}
                >
                    <div style={style} onClick={() => onClick(table)}>
                        <span>{table.name}</span>
                    </div>
                </ResizableBox>
            </div>
        </Draggable>
    );
});

function PosPage() {
    const { user } = useContext(AuthContext);

    // Estados locales del componente (UI y datos de la página)
    const [tables, setTables] = useState([]);
    const [products, setProducts] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    /*const lastClickTime = useRef(0);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const { isPanelOpen, selectedTable, currentOrder, selectTable, addToOrder, removeFromOrder, closePanel } = usePosStore();*/

    const {
        isPanelOpen,
        selectedTable,
        currentOrder,
        currentOrderId,
        selectTable,
        addToOrder,
        removeFromOrder,
        closePanel
    } = usePosStore();

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
                toast.error("Error al cargar datos iniciales.");
                console.error("Error al cargar datos:", error);
            }
        };
        fetchData();
    }, []);

    const handleDragStop = useCallback((e, data, table) => {
        // Si la posición no cambió, fue un clic, lo maneja el onClick.
        if (data.x === table.x && data.y === table.y) return;

        api.put(`/tables/${table.id}/layout`, { x: data.x, y: data.y }).catch(console.error);
        setTables(prevTables => prevTables.map(t => (t.id === table.id ? { ...t, x: data.x, y: data.y } : t)));
    }, []);

    const handleResizeStart = () => {
        setIsResizing(true);
    };

    const handleResizeStop = {
        start: () => setIsResizing(true),
        stop: (e, data, table) => {
            setIsResizing(false);
            const { width, height } = data.size;
            api.put(`/tables/${table.id}/layout`, { width, height, x: table.x, y: table.y }).catch(console.error);
            setTables(prevTables => prevTables.map(t => (t.id === table.id ? { ...t, width, height } : t)));
        }
    };

    const handleDoubleClick = useCallback((table) => {
        if (!isEditMode) return;
        const newShape = table.shape === 'square' ? 'circle' : 'square';
        api.put(`/tables/${table.id}/shape`, { shape: newShape }).catch(console.error);
        setTables(prevTables =>
            prevTables.map(t => (t.id === table.id ? { ...t, shape: newShape } : t))
        );
    }, [isEditMode]);

    //Función para manejar el clic en una mesa
    const handleTableClick = useCallback(async (table) => {
        if (isEditMode || isResizing) return;

        if (table.status === 'occupied') {
            try {
                const res = await api.get(`/orders/table/${table.id}`);
                const orderItems = res.data ? res.data.items.map(item => ({ ...item.product, quantity: item.quantity })) : [];
                const orderId = res.data ? res.data.id : null;
                selectTable(table, orderItems, orderId);
            } catch (error) {
                toast.error("Error al cargar el pedido de la mesa.");
                selectTable(table, [], null);
            }
        } else {
            selectTable(table, [], null);
        }
    }, [isEditMode, isResizing, selectTable]);

    const handleAddToOrder = (product) => {
        setCurrentOrder(prevOrder => {
            const existingItem = prevOrder.find(item => item.id === product.id);
            if (existingItem) {
                // incrementa la cantidad
                return prevOrder.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            // añáde con cantidad 1
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

    const handleSaveChanges = useCallback(async () => {
        if (!selectedTable) return;

        const orderData = {
            tableId: selectedTable.id,
            items: currentOrder.map(item => ({ productId: item.id, quantity: item.quantity })),
        };

        const promise = api.post('/orders', orderData);

        toast.promise(promise, {
            loading: 'Guardando pedido...',
            success: (res) => {
                setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'occupied' } : t));
                closePanel(); // Cierra el panel a través del store
                return 'Pedido guardado con éxito.';
            },
            error: 'Error al guardar el pedido.',
        });
    }, [selectedTable, currentOrder, closePanel]);

    const handleFinalize = useCallback(async () => {
        if (!currentOrderId) {
            toast.error('Este pedido aún no se ha guardado. Guarda los cambios primero.');
            return;
        }

        const promise = api.put(`/orders/${currentOrderId}/finalize`);

        toast.promise(promise, {
            loading: 'Finalizando venta...',
            success: () => {
                setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'available' } : t));
                closePanel();
                return '¡Venta completada!';
            },
            error: 'Error al finalizar la venta.',
        });
    }, [currentOrderId, selectedTable, closePanel]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Punto de Venta</h2>
                {user?.role === 'ADMIN' && (
                    <button onClick={() => setIsEditMode(!isEditMode)}>
                        {isEditMode ? '✓ Guardar Layout' : '✎ Editar Layout'}
                    </button>
                )}
            </div>

            <div style={{ height: '80vh', position: 'relative', border: '1px solid #ccc', background: '#f0f0f0' }}>
                {tables.map(table => (
                    <TableComponent
                        key={table.id}
                        table={table}
                        onDragStop={handleDragStop}
                        onResizeStop={handleResizeStop}
                        onDoubleClick={handleDoubleClick}
                        onClick={handleTableClick}
                        isEditMode={isEditMode}
                        isResizing={isResizing}
                    />
                ))}
            </div>

            {/* El panel controlado por el Zustand */}
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