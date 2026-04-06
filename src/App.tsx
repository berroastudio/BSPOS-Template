import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StorefrontPage } from './pages/StorefrontPage';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { CheckoutCancelled } from './pages/CheckoutCancelled';

// NOTE sobre Clerk:
// Si deseas habilitar autenticación, envuelve aqui con <ClerkProvider>:
// import { ClerkProvider } from '@clerk/clerk-react';
// const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// <ClerkProvider publishableKey={CLERK_KEY}>...</ClerkProvider>

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Storefront principal */}
        <Route path="/" element={<StorefrontPage />} />

        {/* Checkout results */}
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancelled" element={<CheckoutCancelled />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
