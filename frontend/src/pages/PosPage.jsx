import React, { useState, useEffect, useRef, useContext, useCallback, memo } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import Draggable from 'react-draggable';
import OrderPanel from '../components/OrderPanel';
import PaymentModal from '../components/PaymentModal';

import { socket } from '../socket';
import { ResizableBox } from 'react-resizable';
import { usePosStore } from '../store/posStore';
import { AuthContext } from '../context/AuthContext';

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

    //Estado para controlar el modal de pago
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

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
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        socket.connect();

        function onOrderUpdated(updatedOrder) {
            if (selectedTable && selectedTable.id === updatedOrder.tableId) {
                toast('El pedido ha sido actualizado por otro usuario.', { icon: '🔄' });
                const orderItems = updatedOrder.items.map(item => ({ ...item.product, quantity: item.quantity }));
                selectTable(selectedTable, orderItems, updatedOrder.id);
            }
        }

        socket.on('order_updated', onOrderUpdated);

        return () => {
            socket.off('order_updated', onOrderUpdated);
            socket.disconnect();
        };
    }, [selectedTable, selectTable]);

    useEffect(() => {
        if (selectedTable) {
            socket.emit('join_table', selectedTable.id.toString());
        }
    }, [selectedTable]);

    const handleDragStop = useCallback((e, data, table) => {
        // Si la posición no cambió, fue un clic, lo maneja el onClick.
        if (data.x === table.x && data.y === table.y) return;

        api.put(`/tables/${table.id}/layout`, { x: data.x, y: data.y }).catch(console.error);
        setTables(prevTables => prevTables.map(t => (t.id === table.id ? { ...t, x: data.x, y: data.y } : t)));
    }, []);

    const handleResizeStop = {
        start: () => setIsResizing(true),
        stop: (e, data, table) => {
            setIsResizing(false);
            const { width, height } = data.size;
            api.put(`/tables/${table.id}/layout`, { width, height, x: table.x, y: table.y }).catch(console.error);
            setTables(prev => prev.map(t => (t.id === table.id ? { ...t, width, height } : t)));
        }
    };

    const handleDoubleClick = useCallback((table) => {
        if (!isEditMode) return;
        const newShape = table.shape === 'square' ? 'circle' : 'square';
        api.put(`/tables/${table.id}/shape`, { shape: newShape }).catch(console.error);
        setTables(prev => prev.map(t => (t.id === table.id ? { ...t, shape: newShape } : t)));
    }, [isEditMode]);

    //Función para manejar el clic en una mesa
    const handleTableClick = useCallback(async (table) => {
        if (isEditMode || isResizing) return;
        if (table.status === 'occupied') {
            const res = await api.get(`/orders/table/${table.id}`);
            const orderItems = res.data ? res.data.items.map(item => ({ ...item.product, quantity: item.quantity })) : [];
            const orderId = res.data ? res.data.id : null;
            selectTable(table, orderItems, orderId);
        } else {
            selectTable(table, [], null);
        }
    }, [isEditMode, isResizing, selectTable]);

    const handleSaveChanges = useCallback(async () => {
        if (!selectedTable) return;
        const orderData = { tableId: selectedTable.id, items: currentOrder.map(item => ({ productId: item.id, quantity: item.quantity })) };
        const promise = api.post('/orders', orderData);
        toast.promise(promise, {
            loading: 'Guardando pedido...',
            success: () => {
                setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'occupied' } : t));
                closePanel();
                return 'Pedido guardado con éxito.';
            },
            error: 'Error al guardar el pedido.',
        });
    }, [selectedTable, currentOrder, closePanel]);

    const handleOpenPaymentModal = useCallback(() => {
        if (!currentOrderId) {
            toast.error('Guarda los cambios del pedido antes de cobrar.');
            return;
        }
        setPaymentModalOpen(true);
    }, [currentOrderId]);

    const handleProcessPayment = useCallback((paymentData) => {
        const promise = api.put(`/orders/${currentOrderId}/finalize`, paymentData);
        toast.promise(promise, {
            loading: 'Procesando pago...',
            success: () => {
                setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'available' } : t));
                setPaymentModalOpen(false);
                closePanel();
                return '¡Venta completada!';
            },
            error: (err) => err.response?.data?.msg || 'Error al finalizar la venta.',
        });
    }, [currentOrderId, selectedTable, closePanel]);

    const handlePanelClose = useCallback(() => {
        if (currentOrder.length > 0) {
            handleSaveChanges();
        } else {
            closePanel();
        }
    }, [currentOrder, handleSaveChanges, closePanel]);

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

            {isPanelOpen && (
                <OrderPanel
                    table={selectedTable}
                    products={products}
                    order={currentOrder}
                    onClose={handlePanelClose}
                    onAddToOrder={addToOrder}
                    onRemoveFromOrder={removeFromOrder}
                    onSaveChanges={handleSaveChanges}
                    onFinalize={handleOpenPaymentModal}
                />
            )}

            {selectedTable && (
                 <PaymentModal
                    open={isPaymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    orderTotal={currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                    onSubmit={handleProcessPayment}
                />
            )}
        </div>
    );
}

export default PosPage;