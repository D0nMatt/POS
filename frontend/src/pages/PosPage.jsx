import React, { useState, useEffect, useCallback, useRef, useContext, memo } from 'react';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import OrderPanel from '../components/OrderPanel';
import { usePosStore } from '../store/posStore';
import PaymentModal from '../components/PaymentModal';
import toast from 'react-hot-toast';

const TableComponent = memo(({ table, onDragStop, onResizeStop, onDoubleClick, onClick, isEditMode, isResizing, isSelected }) => {
    const nodeRef = useRef(null);
    const theme = useTheme();

    // Estilos mejorados con colores del tema para mayor contraste y feedback
    const style = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        cursor: isEditMode ? 'grab' : 'pointer',
        backgroundColor: table.status === 'available' ? theme.palette.success.light : theme.palette.error.light,
        border: isSelected ? `3px solid ${theme.palette.primary.main}` : '2px solid #333',
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
    const { isPanelOpen, selectedTable, currentOrder, currentOrderId, isPaymentModalOpen, closePaymentModal, closePanel, selectTable } = usePosStore();

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

    const handleDragStop = useCallback((e, data, table) => {
        if (data.x === table.x && data.y === table.y) return;
        api.put(`/tables/${table.id}/layout`, { x: data.x, y: data.y }).catch(console.error);
        setTables(prev => prev.map(t => (t.id === table.id ? { ...t, x: data.x, y: data.y } : t)));
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
            try {
                const res = await api.get(`/orders/table/${table.id}`);
                const orderItems = res.data ? res.data.items.map(item => ({ ...item.product, quantity: item.quantity })) : [];
                const orderId = res.data ? res.data.id : null;
                selectTable(table, orderItems, orderId);
            } catch (error) {
                toast.error("Error al cargar el pedido.");
                selectTable(table, [], null);
            }
        } else {
            selectTable(table, [], null);
        }
    }, [isEditMode, isResizing, selectTable]);

    const handleProcessPayment = useCallback((paymentData) => {
        const promise = api.put(`/orders/${currentOrderId}/finalize`, paymentData);
        toast.promise(promise, {
            loading: 'Procesando pago...',
            success: () => {
                setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'available' } : t));
                closePaymentModal();
                closePanel();
                return '¡Venta completada!';
            },
            error: (err) => err.response?.data?.msg || 'Error al finalizar la venta.',
        });
    }, [currentOrderId, selectedTable, setTables, closePaymentModal, closePanel]);

    const handleSuccessSave = () => {
        setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'occupied' } : t));
    };

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

            <div style={{ height: '80vh', position: 'relative', border: '1px solid #ccc' }}>
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
                        isSelected={selectedTable?.id === table.id}
                    />
                ))}
            </div>

            {isPanelOpen && (
                <OrderPanel
                    products={products}
                    onSuccessSave={handleSuccessSave}
                />
            )}

            {selectedTable && (
                 <PaymentModal
                    open={isPaymentModalOpen}
                    onClose={closePaymentModal}
                    orderTotal={currentOrder.reduce((sum, item) => sum + item.value * item.quantity, 0)}
                    onSubmit={handleProcessPayment}
                />
            )}
        </div>
    );
}

export default PosPage;