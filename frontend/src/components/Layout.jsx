// src/components/Layout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout() {
  return (
    <div>
      <Navbar />
      <main style={{ padding: '1rem' }}>
        <Outlet /> {/* Child routes will be rendered here */}
      </main>
    </div>
  );
}

export default Layout;