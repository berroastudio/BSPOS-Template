import { useState } from 'react';
import { X, ShoppingBag, Shield, CreditCard, Check, Minus, Plus, AlertCircle } from 'lucide-react';
import { BSLoading } from './BSLoading';
import { useUser } from '@clerk/clerk-react';
import { STORES, ADDON_DEFS, fmt, getVarKey, type StoreId, type Currency } from '../config/stores';
import { getProductPrice } from '../lib/storefront-api';
import { redirectToCheckout, isStripeConfigured } from '../lib/stripe-checkout';
import type { CartItem } from './ProductCard';

interface CheckoutPanelProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  currency: Currency;
  storeId: StoreId;
  onClose: () => void;
}

type PromoState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; message: string; discountAmount: number; promoId: string }
  | { status: 'err'; message: string };

export function CheckoutPanel({ cart, setCart, currency, storeId, onClose }: CheckoutPanelProps) {
  const { user } = useUser();
  const [promo, setPromo] = useState('');
  const [promoState, setPromoState] = useState<PromoState>({ status: 'idle' });
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [inventoryMap, setInventoryMap] = useState<Record<string, number>>({});
  
  // Shipping & Logistics states
  const [carrierId, setCarrierId] = useState('flash_delivery');
  const [customShippingPrice, setCustomShippingPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchInv = async () => {
      const { getInventory } = await import('../lib/storefront-api');
      const map: Record<string, number> = {};
      for (const item of cart) {
        if (item.variant?.id) {
          const inv = await getInventory(item.variant.id);
          if (inv) map[item.variant.id] = inv.available;
        }
      }
      setInventoryMap(map);
    };
    fetchInv();
  }, []); // eslint-disable-line

  const subtotal = cart.reduce((s, item) => {
    const base = getProductPrice(item.product, currency) * item.qty;
    const add = (item.addons || []).reduce(
      (a, id) => a + (ADDON_DEFS[id]?.price[currency] || 0), 0
    ) * item.qty;
    return s + base + add;
  }, 0);

  const discount = promoState.status === 'ok' ? promoState.discountAmount : 0;

  // Free shipping thresholds
  const freeShippingThreshold = currency === 'DOP' ? 8000 : currency === 'EUR' ? 130 : 150;
  const shippingBase = currency === 'DOP' ? 450 : currency === 'EUR' ? 7 : 8;
  const shipping = (subtotal - discount) > freeShippingThreshold ? 0 : shippingBase;

  const taxRate = STORES[storeId].tax_rate || 0;
  
  // Use custom shipping price if edited, otherwise calculated shipping
  const actualShipping = customShippingPrice !== null ? customShippingPrice : shipping;
  
  const taxAmount = taxRate > 0 ? ((subtotal - discount + actualShipping) * taxRate) / 100 : 0;
  const total = subtotal - discount + actualShipping + taxAmount;

  const updQty = (idx: number, d: number) =>
    setCart(c => c.map((it, i) => i === idx ? { ...it, qty: Math.max(1, it.qty + d) } : it));
  const rm = (idx: number) =>
    setCart(c => c.filter((_, i) => i !== idx));

  const applyPromo = async () => {
    if (!promo.trim()) return;
    setPromoState({ status: 'loading' });
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) throw new Error('Supabase URL not configured');

      const res = await fetch(`${supabaseUrl}/functions/v1/validate-promo`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': supabaseAnon,
          'Authorization': `Bearer ${supabaseAnon}`
        },
        body: JSON.stringify({ code: promo.trim(), subtotal, currency, storeId }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoState({ status: 'ok', message: data.message, discountAmount: data.discountAmount, promoId: data.promoId });
      } else {
        setPromoState({ status: 'err', message: data.message || 'Código no válido' });
      }
    } catch (err: any) {
      console.error('Promo error:', err);
      setPromoState({ status: 'err', message: 'Error al validar el código' });
    }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="panel">
        {/* Header */}
        <div className="panel-hd">
          <h2>Your Cart {cart.length > 0 && `(${cart.length})`}</h2>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>

        {/* Body */}
        <div className="panel-body">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={38} />
              <p style={{ fontSize: '.875rem' }}>Your cart is empty</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              {cart.map((item, idx) => {
                const itemPrice = getProductPrice(item.product, currency);
                const firstImg = (item.product.media as any)?.images?.[0];
                return (
                  <div key={idx} className="ci">
                    <div className="ci-img">
                      {firstImg && <img src={firstImg} alt={item.product.name} />}
                    </div>
                    <div className="ci-info">
                      <div className="ci-name">{item.product.name}</div>
                      {item.variant && (
                        <div className="ci-meta">{getVarKey(item.variant.attributes)}</div>
                      )}
                      {(item.addons?.length ?? 0) > 0 && (
                        <div className="ci-addons">
                          {item.addons.map(id => {
                            const d = ADDON_DEFS[id];
                            return (
                              <span key={id} className="ci-atag">
                                <d.Icon size={8} /> {d.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <div className="ci-bot">
                        <span className="ci-price">{fmt(itemPrice * item.qty, currency)}</span>
                        <div className="ci-actions">
                          <div className="ci-qty">
                            <button onClick={() => updQty(idx, -1)}><Minus size={10} /></button>
                            <span style={{ padding: '0 .4rem', fontSize: '.8rem', fontWeight: 600 }}>{item.qty}</span>
                            <button onClick={() => updQty(idx, 1)}><Plus size={10} /></button>
                          </div>
                          <button className="ci-rm" onClick={() => rm(idx)}><X size={12} /></button>
                        </div>
                      </div>
                      {item.variant?.id && inventoryMap[item.variant.id] !== undefined && item.qty > inventoryMap[item.variant.id] && (
                        <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(235, 114, 100, 0.1)', borderRadius: '6px', fontSize: '0.72rem', color: '#e05b4b', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>Compromiso de Disponibilidad:</strong> Tenemos {inventoryMap[item.variant.id]} unidades listas. Notificamos que cobraremos las unidades en inventario ahora y las demás le comunicaremos antes de enviar su orden.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Promo Code */}
              <div className="promo-row">
                <input
                  className="promo-in"
                  placeholder="Código promocional"
                  value={promo}
                  onChange={e => { setPromo(e.target.value); setPromoState({ status: 'idle' }); }}
                  onKeyDown={e => e.key === 'Enter' && applyPromo()}
                />
                <button
                  className="btn btn-sm"
                  onClick={applyPromo}
                  disabled={promoState.status === 'loading'}
                >
                  {promoState.status === 'loading' ? '...' : 'Aplicar'}
                </button>
              </div>
              {promoState.status === 'loading' && (
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <BSLoading label="Validando código..." />
                </div>
              )}
              {promoState.status === 'ok' && (
                <div className="promo-ok"><Check size={11} /> {promoState.message}</div>
              )}
              {promoState.status === 'err' && (
                <div className="promo-err"><AlertCircle size={11} /> {promoState.message}</div>
              )}

              {/* Summary */}
              <div className="summary">
                <div className="sum-row"><span>Subtotal</span><span>{fmt(subtotal, currency)}</span></div>
                {discount > 0 && (
                  <div className="sum-row"><span>Descuento</span><span>−{fmt(discount, currency)}</span></div>
                )}
                <div className="sum-row" style={{ flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>Shipping ({carrierId})</span>
                    <span>{actualShipping === 0 ? 'Free 🎉' : fmt(actualShipping, currency)}</span>
                  </div>
                  
                  {/* Delivery Selection UI */}
                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '4px' }}>
                    <select 
                      className="promo-in" 
                      style={{ flex: 1, padding: '4px 8px', fontSize: '0.75rem' }}
                      value={carrierId}
                      onChange={(e) => setCarrierId(e.target.value)}
                    >
                      <option value="flash_delivery">Flash Delivery (BS)</option>
                      <option value="uber_flash">Uber Flash</option>
                      <option value="indriver">InDrive / Mensajería</option>
                      <option value="pickup">Recogida Personal</option>
                    </select>
                    <input 
                      type="number"
                      className="promo-in"
                      style={{ width: '80px', padding: '4px 8px', fontSize: '0.75rem' }}
                      placeholder="Precio"
                      value={customShippingPrice ?? ''}
                      onChange={(e) => setCustomShippingPrice(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </div>
                </div>
                {taxAmount > 0 && (
                  <div className="sum-row">
                    <span>ITBIS ({taxRate}%)</span>
                    <span>{fmt(taxAmount, currency)}</span>
                  </div>
                )}
                <div className="sum-row"><span>Total</span><span>{fmt(total, currency)}</span></div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="panel-ft">
            {checkoutError && (
              <div style={{ fontSize: '.75rem', color: '#e05b4b', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <AlertCircle size={12} /> {checkoutError}
              </div>
            )}
            <button
              className="btn btn-solid btn-full"
              disabled={checkingOut}
              onClick={async () => {
                if (checkingOut) return;
                setCheckingOut(true);
                setCheckoutError(null);
                try {
                  if (!isStripeConfigured()) {
                    setCheckoutError('Stripe no configurado. Añade VITE_STRIPE_PUBLISHABLE_KEY en .env.local con tu pk_live_...');
                    setCheckingOut(false);
                    return;
                  }

                  const media = (p: any) => {
                    const imgs = p.media?.images || [];
                    return imgs[0] || undefined;
                  };

                  await redirectToCheckout({
                    currency: currency.toLowerCase(),
                    items: cart.map(item => ({
                      name: item.product.name + (item.variant ? ` (${Object.values((item.variant as any).attributes || {}).join(' / ')})` : ''),
                      price: getProductPrice(item.product, currency),
                      quantity: item.qty,
                      image: media(item.product),
                      product_id: item.product.id,
                      variant_id: (item.variant as any)?.id,
                    })),
                    metadata: {
                      store: storeId,
                      promo: promoState.status === 'ok' ? promoState.promoId : '',
                      customer_clerk_id: user?.id || '',
                      tenant_id: STORES[storeId].tenant_id || '',
                    },
                    userId: user?.id,
                    shipping_price: actualShipping,
                    carrier_id: carrierId
                  });
                } catch (err: any) {
                  setCheckoutError(err.message || 'Error al iniciar checkout');
                  setCheckingOut(false);
                }
              }}
            >
              {checkingOut ? (
                <><BSLoading size={13} /> Procesando...</>
              ) : (
                <><CreditCard size={13} /> Checkout · {fmt(total, currency)}</>
              )}
            </button>
            <div className="secure">
              <Shield size={10} />
              Encrypted & secure · {STORES[storeId].flag} {currency}
            </div>
          </div>
        )}
      </div>
      {checkingOut && (
        <BSLoading fullPage label="Procesando tu orden en Berroa Studio..." />
      )}
    </div>
  );
}
