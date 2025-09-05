// src/pages/PosPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';

function PosPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await api.get('/tables');
        setTables(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const handleDragStop = (e, data, tableId) => {
    const { x, y } = data;
    api.put(`/tables/${tableId}/layout`, { x, y }).catch(console.error);
    setTables(prevTables => prevTables.map(t => (t.id === tableId ? { ...t, x, y } : t)));
  };

  const handleResizeStop = (e, data, tableId) => {
    const { width, height } = data.size;
    api.put(`/tables/${tableId}/layout`, { width, height }).catch(console.error);
    setTables(prevTables => prevTables.map(t => (t.id === tableId ? { ...t, width, height } : t)));
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
        onStop={(e, data) => handleDragStop(e, data, table.id)}
      >
        {/* Este div ahora es el ancla para arrastrar */}
        <div ref={nodeRef} style={{ position: 'absolute' }}>
          <ResizableBox
            width={table.width}
            height={table.height}
            onResizeStop={(e, data) => handleResizeStop(e, data, table.id)}
            className="box"
            lockAspectRatio={table.shape === 'circle'}
          >
            {/* Y este es el div que contiene el estilo y el contenido */}
            <div style={style}>
              <span>{table.name}</span>
            </div>
          </ResizableBox>
        </div>
      </Draggable>
    );
  };

  return (
    <div>
      <h2>Punto de Venta (Modo Edición)</h2>
      <div style={{ height: '80vh', position: 'relative', border: '1px solid #ccc' }}>
        {loading ? <p>Cargando mesas...</p> : 
          tables.map(table => <Table key={table.id} table={table} />)
        }
      </div>
    </div>
  );
}

export default PosPage;