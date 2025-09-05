import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import OrderPanel from '../components/OrderPanel';

function PosPage() {
  const { user } = useContext(AuthContext);
  console.log('Usuario en el contexto de PosPage:', user);
  const [tables, setTables] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [products, setProducts] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

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

  const handleDragStop = (e, data, table) => {
    if (!isEditMode) {
      if (data.x === table.x && data.y === table.y) {
        handleTableClick(table);
      }
    } else {
      api.put(`/tables/${table.id}/layout`, { x: data.x, y: data.y }).catch(console.error);
      setTables(prevTables => prevTables.map(t => (t.id === table.id ? { ...t, x: data.x, y: data.y } : t)));
    }
  };

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const handleResizeStop = (e, data, table) => {
    setIsResizing(false);
    const { width, height } = data.size;
    api.put(`/tables/${table.id}/layout`, { width, height, x: table.x, y: table.y }).catch(console.error);
    setTables(prevTables => prevTables.map(t => (t.id === table.id ? { ...t, width, height } : t)));
  };

  //Función para manejar el clic en una mesa
  const handleTableClick = (table) => {
    setSelectedTable(table);
    setIsPanelOpen(true);
  };

  const handleAddToOrder = (product) => {
    console.log(`Añadiendo ${product.name} al pedido de la ${selectedTable.name}`);
    // Lógica para añadir al pedido irá aquí
  };

  const handleFinalizeSale = () => {
    console.log(`Finalizando venta para la ${selectedTable.name}`);
    // Lógica para llamar a la API de ventas irá aquí
  };

  const Table = ({ table }) => {
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
      // Estos dos son clave para que el div interno llene el ResizableBox
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
  };

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
          onClose={() => setIsPanelOpen(false)}
          onAddToOrder={handleAddToOrder}
          onFinalizeSale={handleFinalizeSale}
        />
      )}
    </div>
  );
}

export default PosPage;