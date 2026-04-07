import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { StorefrontPage } from './pages/StorefrontPage';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { CheckoutCancelled } from './pages/CheckoutCancelled';
import { MyAccountPage } from './pages/MyAccountPage';
import { useEffect, useState } from 'react';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function SubdomainRouter() {
  const [hostname, setHostname] = useState(window.location.hostname);

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  // 1. Portal de Cliente: myaccount.berroastudio.com
  if (hostname.includes('myaccount.')) {
    return (
      <Routes>
        <Route path="/" element={
          <SignedIn><MyAccountPage /></SignedIn>
        } />
        <Route path="*" element={<SignedIn><MyAccountPage /></SignedIn>} />
      </Routes>
    );
  }

  // 2. Checkout: buy.berroastudio.com
  if (hostname.includes('buy.')) {
    return (
      <Routes>
        <Route path="/" element={<StorefrontPage defaultView="cart" />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancelled" element={<CheckoutCancelled />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // 3. Tienda Principal: berroastudio.com o localhost
  return (
    <Routes>
      <Route path="/" element={<StorefrontPage />} />
      <Route path="/my-account" element={
        <>
          <SignedIn><MyAccountPage /></SignedIn>
          <SignedOut><RedirectToSignIn /></SignedOut>
        </>
      } />
      <Route path="/checkout/success" element={<CheckoutSuccess />} />
      <Route path="/checkout/cancelled" element={<CheckoutCancelled />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  if (!CLERK_KEY) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 italic text-gray-500">
        Configura VITE_CLERK_PUBLISHABLE_KEY para continuar.
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <BrowserRouter>
        <SubdomainRouter />
      </BrowserRouter>
    </ClerkProvider>
  );
}
