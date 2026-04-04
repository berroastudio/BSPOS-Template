import { useState, useEffect } from 'react';
import { Search, User, ShoppingBag, Sun, Moon } from 'lucide-react';
import { StoreStrip } from '../components/StoreStrip';
import { ProductCard, type CartItem } from '../components/ProductCard';
import { ProductDetail } from '../components/ProductDetail';
import { CheckoutPanel } from '../components/CheckoutPanel';
import { Toast } from '../components/Toast';
import { getActiveProducts } from '../lib/storefront-api';
import { STORES, type StoreId, type Currency } from '../config/stores';
import type { Product, Variant } from '../types/database';

type View = 'grid' | 'detail';

// ─── Skeleton loader ──────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="loading-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-img" />
          <div className="skeleton-body">
            <div className="skeleton-line" />
            <div className="skeleton-line w60" />
            <div className="skeleton-line w40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Storefront Page ─────────────────────────────────

export function StorefrontPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [storeId, setStoreId] = useState<StoreId>('usa');
  const [view, setView] = useState<View>('grid');
  const [selected, setSelected] = useState<Product | null>(null);
  const [filter, setFilter] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Data from Supabase
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency: Currency = STORES[storeId].currency;

  // ─── Apply theme ───────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ─── Load products from Supabase ───────────────────────
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getActiveProducts()
      .then(data => {
        if (mounted) {
          setProducts(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('[StorefrontPage] Error loading products:', err);
        if (mounted) {
          setError('No se pudieron cargar los productos. Revisa la conexión.');
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, []);

  // ─── Derived state ─────────────────────────────────────
  const categories = ['All', ...Array.from(
    new Set(products.map(p => p.category).filter(Boolean))
  ) as string[]];

  const filtered = filter === 'All'
    ? products
    : products.filter(p => p.category === filter);

  // ─── Handlers ──────────────────────────────────────────
  const openProduct = (p: Product) => {
    setSelected(p);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product: Product, variant: Variant | null, addons: string[], qty = 1) => {
    setCart(c => [...c, { product, variant, addons, qty }]);
    showToast(`${product.name} added ✓`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleStoreChange = (id: StoreId) => {
    setStoreId(id);
    setView('grid');
    setSelected(null);
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <>
      {/* Store Selector */}
      <StoreStrip activeStore={storeId} onStoreChange={handleStoreChange} />

      {/* Navigation */}
      <nav className="nav">
        <span className="nav-logo" onClick={() => setView('grid')}>
          Berroa <em>Studio</em>
        </span>
        <div className="nav-links">
          {['New Arrivals', 'Clothing', 'Home', 'Sale', 'About'].map(l => (
            <span
              key={l}
              className="nav-link"
              onClick={() => {
                if (['Clothing', 'Home'].includes(l)) {
                  setFilter(l);
                  setView('grid');
                }
              }}
            >
              {l}
            </span>
          ))}
        </div>
        <div className="nav-right">
          <button className="icon-btn" aria-label="Search">
            <Search size={16} />
          </button>
          <button className="icon-btn" aria-label="Account">
            <User size={16} />
          </button>
          <button
            className="icon-btn cart-wrap"
            onClick={() => setCartOpen(true)}
            aria-label={`Cart (${cart.length} items)`}
          >
            <ShoppingBag size={16} />
            {cart.length > 0 && <span className="cart-dot" />}
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

      {/* Main Content */}
      <div className="container">
        {view === 'grid' && (
          <>
            {/* Filter bar */}
            <div className="filter-bar">
              <div className="pills">
                {categories.map(c => (
                  <button
                    key={c}
                    className={`pill${filter === c ? ' active' : ''}`}
                    onClick={() => setFilter(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <span className="count">
                {loading ? '...' : `${filtered.length} products`}
              </span>
            </div>

            {/* Product grid */}
            {loading && <SkeletonGrid />}

            {!loading && error && (
              <div className="error-state">
                <h3>Error cargando productos</h3>
                <p>{error}</p>
                <button
                  className="btn btn-solid"
                  style={{ marginTop: '1rem' }}
                  onClick={() => window.location.reload()}
                >
                  Reintentar
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="error-state">
                <h3>No hay productos en esta categoría</h3>
                <p>Intenta con otra categoría o vuelve más tarde.</p>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="grid">
                {filtered.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    idx={i}
                    currency={currency}
                    onClick={openProduct}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {view === 'detail' && selected && (
          <ProductDetail
            product={selected}
            storeId={storeId}
            currency={currency}
            onBack={() => setView('grid')}
            onAddToCart={addToCart}
          />
        )}
      </div>

      {/* Cart Overlay */}
      {cartOpen && (
        <CheckoutPanel
          cart={cart}
          setCart={setCart}
          currency={currency}
          storeId={storeId}
          onClose={() => setCartOpen(false)}
        />
      )}

      {/* Toast notification */}
      <Toast message={toast} />
    </>
  );
}
