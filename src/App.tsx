import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StorefrontPage } from './pages/StorefrontPage';

// NOTE sobre Clerk:
// Si deseas habilitar autenticación, envuelve aqui con <ClerkProvider>:
// import { ClerkProvider } from '@clerk/clerk-react';
// const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// <ClerkProvider publishableKey={CLERK_KEY}>...</ClerkProvider>
//
// Roles futuros:
// - 'customer': acceso a historial de órdenes, perfil, etc.
// - Se añade en Clerk Dashboard > Roles (misma app que el backoffice)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Storefront principal */}
        <Route path="/" element={<StorefrontPage />} />

        {/* TODO: Rutas futuras */}
        {/* <Route path="/account" element={<AccountPage />} /> */}
        {/* <Route path="/orders" element={<OrdersPage />} /> */}
        {/* <Route path="/product/:id" element={<ProductPage />} /> */}

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
