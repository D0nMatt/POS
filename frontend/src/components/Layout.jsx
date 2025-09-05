// src/components/Layout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout({ pageProps }) {
  return (
    <div>
      <Navbar {...pageProps} />
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;