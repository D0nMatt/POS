import React, { useState, useEffect } from 'react';
import api from '../api';

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

  const tableStyle = (status) => ({
    border: '2px solid #333',
    borderRadius: '8px',
    padding: '2rem',
    margin: '1rem',
    width: '100px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: status === 'available' ? '#90ee90' : '#f08080',
    fontWeight: 'bold',
  });

  return (
    <div>
      <h2>Punto de Venta</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {loading ? <p>Cargando mesas...</p> : 
          tables.map(table => (
            <div key={table.id} style={tableStyle(table.status)}>
              {table.name}
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default PosPage;