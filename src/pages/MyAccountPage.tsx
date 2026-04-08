import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { ShoppingBag, User, Package, ChevronRight, Save, LogOut, Sun, Moon, Search } from 'lucide-react';
import { getCustomerOrders, getCustomerProfile, updateCustomerProfile, syncCustomerWithSupabase } from '../lib/customer-api';
import { BSLoading } from '../components/BSLoading';
import type { Order, Customer } from '../types/database';
import { Toast } from '../components/Toast';
import { StoreStrip } from '../components/StoreStrip';
import { STORES, type StoreId } from '../config/stores';

export function MyAccountPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [storeId, setStoreId] = useState<StoreId>('usa');
  const [profile, setProfile] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    rnc: '',
    razon_social: '',
    shipping_address: '',
    billing_address: ''
  });

  // ─── Theme Effect ──────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const customer = await syncCustomerWithSupabase(user);
      if (customer) {
        setProfile(customer);
        setFormData({
          name: customer.name || '',
          phone: customer.phone || '',
          rnc: (customer as any).rnc || '',
          razon_social: (customer as any).razon_social || '',
          shipping_address: typeof customer.shipping_address === 'string' ? customer.shipping_address : JSON.stringify(customer.shipping_address || ''),
          billing_address: typeof customer.billing_address === 'string' ? customer.billing_address : JSON.stringify(customer.billing_address || '')
        });
        
        try {
          const orderHistory = await getCustomerOrders(customer.email);
          setOrders(orderHistory);
        } catch (oErr) {
          console.error("Error loading orders:", oErr);
        }
      } else {
        setError("No pudimos vincular tu cuenta con nuestro sistema. Intenta cerrar sesión y volver a entrar.");
      }
    } catch (err) {
      console.error('Error loading account data:', err);
      setError("Ocurrió un error inesperado al cargar tu perfil.");
    } finally {
      setLoading(false);
    }
  }

  const [error, setError] = useState<string | null>(null);

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);
    const updates = {
      ...formData,
      shipping_address: formData.shipping_address,
      billing_address: formData.billing_address
    };

    const success = await updateCustomerProfile(profile.id, updates as any);
    if (success) {
      setToast('¡Perfil actualizado! ✓');
      setTimeout(() => setToast(null), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return <BSLoading fullPage label="Cargando tu cuenta de Berroa Studio..." />;
  }

  return (
    <>
      <StoreStrip activeStore={storeId} onStoreChange={setStoreId} />

      <nav className="nav">
        <span className="nav-logo" onClick={() => window.location.href = '/'}>
          Berroa <em>Studio</em>
        </span>
        <div className="nav-links">
          <span className="nav-link active">Mi Cuenta</span>
          <span className="nav-link" onClick={() => window.location.href = '/'}>Tienda</span>
        </div>
        <div className="nav-right">
          <button className="icon-btn" aria-label="Search">
            <Search size={16} />
          </button>
          <button className="icon-btn" aria-label="Account" style={{ background: 'var(--bg2)' }}>
            <User size={16} />
          </button>
          <button className="icon-btn" onClick={() => window.location.href = '/'}>
            <ShoppingBag size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </nav>

      <div className="container" style={{ padding: '3rem 2rem' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '3rem',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'var(--accent)', 
              color: 'var(--accent-fg)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              boxShadow: 'var(--shadow)'
            }}>
              {user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0].toUpperCase()}
            </div>
            <div>
              <h1 style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '2rem', 
                fontWeight: 500, 
                fontStyle: 'italic',
                marginBottom: '0.2rem'
              }}>Hola, {user?.firstName || 'cliente'}</h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="btn"
            style={{ borderColor: '#e05b4b', color: '#e05b4b' }}
          >
            <LogOut size={14} /> Salir
          </button>
        </header>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '2.5rem',
          alignItems: 'start'
        }}>
          {/* Perfil Fiscal */}
          <section className="card" style={{ padding: '2rem', animation: 'fadeUp 0.3s ease both' }}>
            <h3 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '1.15rem', 
              fontStyle: 'italic', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <User size={18} /> Datos de Facturación
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="var-label">Nombre / Razón Social</label>
                <input 
                  type="text" 
                  className="promo-in"
                  style={{ width: '100%', padding: '0.75rem' }}
                  value={formData.razon_social}
                  onChange={e => setFormData({...formData, razon_social: e.target.value})}
                  placeholder="Ej. Berroa Studio SRL"
                />
              </div>
              <div>
                <label className="var-label">RNC / Cédula</label>
                <input 
                  type="text" 
                  className="promo-in"
                  style={{ width: '100%', padding: '0.75rem' }}
                  value={formData.rnc}
                  onChange={e => setFormData({...formData, rnc: e.target.value})}
                  placeholder="1-31-..."
                />
              </div>
              <div>
                <label className="var-label">Teléfono de Contacto</label>
                <input 
                  type="text" 
                  className="promo-in"
                  style={{ width: '100%', padding: '0.75rem' }}
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="var-label">Dirección Fiscal</label>
                <textarea 
                  className="promo-in"
                  style={{ width: '100%', padding: '0.75rem', minHeight: '80px', resize: 'none' }}
                  value={formData.billing_address}
                  onChange={e => setFormData({...formData, billing_address: e.target.value})}
                />
              </div>
              
              <button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn btn-solid btn-full"
                style={{ marginTop: '0.5rem' }}
              >
                {saving ? 'Guardando...' : <><Save size={16} /> Actualizar Perfil</>}
              </button>
            </div>
          </section>

          {/* Mis Compras */}
          <section className="card" style={{ padding: '2rem', animation: 'fadeUp 0.3s ease 0.1s both' }}>
            <h3 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '1.15rem', 
              fontStyle: 'italic', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Package size={18} /> Mis Compras
            </h3>

            {orders.length === 0 ? (
              <div className="empty-cart">
                <ShoppingBag size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
                <p style={{ fontSize: '0.85rem' }}>Aún no has realizado ninguna compra.</p>
                <a href="/" style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.75rem', textDecoration: 'underline', marginTop: '1rem', display: 'block' }}>Explorar tienda</a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="ci" 
                    style={{ 
                      margin: 0, 
                      padding: '1rem', 
                      background: 'var(--bg2)', 
                      borderRadius: 'var(--r-sm)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="ci-info">
                      <div className="ci-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Pedido #{order.id.split('-')[0].toUpperCase()}</span>
                        <span style={{ color: 'var(--green)', fontSize: '0.7rem' }}>
                          {order.currency} {order.total?.toLocaleString()}
                        </span>
                      </div>
                      <div className="ci-meta">
                        {new Date(order.created_at).toLocaleDateString()} • <span style={{ textTransform: 'uppercase' }}>{order.status}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ alignSelf: 'center', color: 'var(--muted)' }} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      
      <Toast message={toast} />
    </>
  );
}
