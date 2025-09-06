import { create } from 'zustand';

export const usePosStore = create((set) => ({
    // Estado inicial
    selectedTable: null,
    isPanelOpen: false,
    currentOrder: [],
    currentOrderId: null,

    // Acciones para modificar el estado
    selectTable: (table, order, orderId) => set({
        selectedTable: table,
        currentOrder: order,
        currentOrderId: orderId,
        isPanelOpen: true,
    }),

    closePanel: () => set({ isPanelOpen: false, selectedTable: null, currentOrder: [], currentOrderId: null }),

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
}));