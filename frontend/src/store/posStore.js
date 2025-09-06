import { create } from 'zustand';
import api from '../api';
import toast from 'react-hot-toast';

export const usePosStore = create((set, get) => ({
    // Estado inicial
    selectedTable: null,
    isPanelOpen: false,
    currentOrder: [],
    currentOrderId: null,
    isPaymentModalOpen: false,

    // --- ACCIONES ---

    // Acción para seleccionar una mesa y abrir el panel
    selectTable: (table, order, orderId) => set({
        selectedTable: table,
        currentOrder: order || [],
        currentOrderId: orderId || null,
        isPanelOpen: true,
    }),

    // Acción para cerrar el panel (y limpiar el estado)
    closePanel: () => set({
        isPanelOpen: false,
        selectedTable: null,
        currentOrder: [],
        currentOrderId: null,
    }),

    // Acciones para modificar el pedido
    addToOrder: (product) => set((state) => {
        const existingItem = state.currentOrder.find(item => item.id === product.id);
        if (existingItem) {
            return {
                currentOrder: state.currentOrder.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                ),
            };
        }
        return { currentOrder: [...state.currentOrder, { ...product, quantity: 1 }] };
    }),
    removeFromOrder: (product) => set((state) => {
        const existingItem = state.currentOrder.find(item => item.id === product.id);
        if (existingItem.quantity === 1) {
            return { currentOrder: state.currentOrder.filter(item => item.id !== product.id) };
        }
        return {
            currentOrder: state.currentOrder.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
            ),
        };
    }),

    // Acción para guardar los cambios en el pedido
    saveChanges: async (callbacks) => {
        const { selectedTable, currentOrder } = get();
        if (!selectedTable) return;

        const orderData = {
            tableId: selectedTable.id,
            items: currentOrder.map(item => ({ productId: item.id, quantity: item.quantity })),
        };

        const promise = api.post('/orders', orderData);

        toast.promise(promise, {
            loading: 'Guardando pedido...',
            success: (res) => {
                // Llamamos a la función de callback para actualizar el estado de las mesas en PosPage
                callbacks.onSuccess();
                // Cerramos el panel
                get().closePanel();
                return 'Pedido guardado con éxito.';
            },
            error: (err) => err.response?.data?.message || 'Error al guardar el pedido.',
        });
    },

    // Acción para abrir el modal de pago
    openPaymentModal: () => {
        const { currentOrderId } = get();
        if (!currentOrderId) {
            toast.error('Guarda los cambios del pedido antes de cobrar.');
            return;
        }
        set({ isPaymentModalOpen: true });
    },

    // Acción para cerrar el modal de pago
    closePaymentModal: () => set({ isPaymentModalOpen: false }),
}));