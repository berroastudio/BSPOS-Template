/// <reference types="vite/client" />
// ============================================================
// BERROA STUDIO — Stripe Checkout Service
// Redirige al cliente a Stripe Checkout para completar el pago
// ============================================================

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const CHECKOUT_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`
  : '';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface CheckoutItem {
  name: string;
  price: number;       // Unit price in display currency (not cents)
  quantity: number;
  image?: string;
  product_id: string;
  variant_id?: string;
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  currency: string;    // 'usd', 'dop', 'eur'
  customer_email?: string;
  metadata?: Record<string, string>;
}

/**
 * Crea una Session de Stripe Checkout y redirige al cliente.
 * El pago se procesa en stripe.com — no se manejan tarjetas localmente.
 *
 * Flujo:
 * 1. POST a Edge Function → crea Stripe Session → devuelve URL
 * 2. window.location.href = sessionUrl (redirect a stripe.com)
 * 3. Stripe procesa pago → redirect a /checkout/success o /checkout/cancelled
 * 4. Webhook en backend crea la orden en Supabase
 */
export async function redirectToCheckout(request: CheckoutRequest): Promise<void> {
  if (!STRIPE_PK) {
    throw new Error('Stripe publishable key no configurada. Contacta al administrador.');
  }

  if (!CHECKOUT_URL) {
    throw new Error('URL de checkout no configurada.');
  }

  // 1. Llamar a nuestra Edge Function para crear la Session
  const response = await fetch(CHECKOUT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
    },
    body: JSON.stringify({
      items: request.items.map(item => ({
        name: item.name,
        amount: Math.round(item.price * 100), // Convert to cents
        quantity: item.quantity,
        image: item.image || undefined,
        product_id: item.product_id,
        variant_id: item.variant_id || undefined,
      })),
      currency: request.currency.toLowerCase(),
      customer_email: request.customer_email,
      success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/checkout/cancelled`,
      metadata: request.metadata || {},
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(err.error || err.message || 'No se pudo iniciar el checkout');
  }

  const data = await response.json();

  // 2. Redirigir directamente a la URL de Stripe Checkout
  // La Edge Function devuelve { url, sessionId }
  if (data.url) {
    window.location.href = data.url;
  } else {
    throw new Error('No se recibió URL de checkout de Stripe');
  }
}

/**
 * Verifica si Stripe está configurado y disponible.
 */
export function isStripeConfigured(): boolean {
  return !!STRIPE_PK && STRIPE_PK !== 'pk_live_51SqtyuBS3tYbvYXHyourpublishablekeyhere';
}
