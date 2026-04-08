import { useState, useEffect } from 'react';
import {
  ChevronLeft, ShoppingBag, Shield, Tag, Star,
  Package, Leaf, Droplets, Recycle, Plus, Minus, Gift, Car, Bike,
  Heart, Share2, MessageCircle, Send, Copy, Instagram, Facebook, Mail, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariantSelector, AddonBadges } from './VariantSelector';
import { STORES, ADDON_DEFS, fmt, type StoreId, type Currency } from '../config/stores';
import { getProductPrice, getCompareAtPrice, getProductCompatibility, type ProductCompat } from '../lib/storefront-api';
import type { Product, Variant } from '../types/database';
import { TopperEditor, type TopperState } from './TopperEditor';

interface ProductDetailProps {
  product: Product;
  storeId: StoreId;
  currency: Currency;
  onBack: () => void;
  onAddToCart: (product: Product, variant: Variant | null, addons: string[], qty: number, metadata?: any) => void;
}

const TOPPER_SIZE_PRICES: Record<string, Record<Currency, number>> = {
  'Pequeño': { USD: 15, DOP: 900, EUR: 14 },
  'Mediano': { USD: 22, DOP: 1300, EUR: 20 },
  'Grande': { USD: 28, DOP: 1650, EUR: 26 },
};

export function ProductDetail({ product, storeId, currency, onBack, onAddToCart }: ProductDetailProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [sv, setSV] = useState<Variant | null>(product.variants?.[0] || null);
  const [addons, setAddons] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [compats, setCompats] = useState<ProductCompat[]>([]);
  const [realStock, setRealStock] = useState<number | null>(null);
  const [topperState, setTopperState] = useState<TopperState | null>(null);
  const [isFav, setIsFav] = useState(() => {
    const saved = localStorage.getItem(`fav-${product.id}`);
    return saved === 'true';
  });
  const [showShare, setShowShare] = useState(false);
  const [skuCopied, setSkuCopied] = useState(false);

  // Toggle favorite
  useEffect(() => {
    localStorage.setItem(`fav-${product.id}`, String(isFav));
  }, [isFav, product.id]);

  const copySku = () => {
    navigator.clipboard.writeText(product.sku);
    setSkuCopied(true);
    setTimeout(() => setSkuCopied(false), 2000);
  };

  const getContactUrl = (type: 'wa' | 'tg', isQuote = false) => {
    const phone = "18293410714"; // Berroa Studio official
    const msg = isQuote 
      ? `¡Hola! Me gustaría una cotización personalizada para el producto: ${product.name} (SKU: ${product.sku}). Link: ${window.location.href}`
      : `¡Hola! Me gustaría más información sobre: ${product.name}. Link: ${window.location.href}`;
    
    if (type === 'wa') return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    return `https://t.me/+${phone}?text=${encodeURIComponent(msg)}`;
  };

  const isTopper = product.category?.toLowerCase() === 'toppers' || product.category?.toLowerCase() === 'topper';

  useEffect(() => {
    getProductCompatibility(product.id).then(setCompats).catch(() => {});
    
    // SEO: Dynamic Title
    const prevTitle = document.title;
    document.title = `${product.name} | Berroa Studio`;
    
    // SEO: Inject Schema.org (JSON-LD)
    const scriptId = `product-schema-${product.id}`;
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      
      const price = getProductPrice(product, currency);
      const images = (product.media as any)?.images || [];
      
      const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": images,
        "description": product.description || `Comprar ${product.name} en Berroa Studio.`,
        "sku": product.sku,
        "offers": {
          "@type": "Offer",
          "url": window.location.href,
          "priceCurrency": currency,
          "price": price,
          "availability": (realStock ?? sv?.inventory_quantity ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
      };

      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Inicio",
            "item": window.location.origin
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": product.category || "Productos",
            "item": `${window.location.origin}/#category-${product.category}`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": product.name,
            "item": window.location.href
          }
        ]
      };

      script.text = JSON.stringify([productSchema, breadcrumbSchema]);
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [product, currency, realStock, sv]);

  useEffect(() => {
    if (sv?.id) {
       import('../lib/storefront-api').then(m => {
         m.getInventory(sv.id).then(inv => {
           if (inv) setRealStock(inv.available);
           else setRealStock(sv.inventory_quantity || 0);
         });
       });
    }
  }, [sv]);

  const media = product.media as any;
  const imgs: string[] = media?.images || [];
  const dimKeys = product.dimensions ? Object.keys(product.dimensions as object) : [];
  const features = (product.features as any[]) || [];
  const sustainability = (product.sustainability as string[]) || [];

  useEffect(() => {
    if (sv?.image_url) {
      const i = imgs.indexOf(sv.image_url);
      if (i > -1) setImgIdx(i);
    }
  }, [sv]); // eslint-disable-line

  const addonAmt = addons.reduce(
    (s, id) => s + (ADDON_DEFS[id]?.price[currency] || 0), 0
  );

  // Price calculation
  let unit = getProductPrice(product, currency);
  if (isTopper && topperState) {
    unit = TOPPER_SIZE_PRICES[topperState.sizeLabel]?.[currency] || unit;
  }

  const compareAt = getCompareAtPrice(product, currency);
  const total = (unit + addonAmt) * qty;
  const stock = isTopper ? 999 : (realStock ?? sv?.inventory_quantity ?? 0);
  const save = compareAt && compareAt > unit ? compareAt - unit : 0;
  const store = STORES[storeId];

  // Icon map for features
  const FEAT_ICONS = [Star, Package, Leaf, Droplets, Recycle, ShoppingBag];

  return (
    <div className="detail-wrap">
      <div className="back" onClick={onBack}>
        <ChevronLeft size={13} /> All Products
      </div>

      <div className={isTopper ? "topper-layout" : "detail-grid"}>
        {/* Visual Area */}
        {isTopper ? (
          <div className="topper-editor-section">
            <TopperEditor currency={currency} onStateChange={setTopperState} />
          </div>
        ) : (
          <div>
            <div className="gal-main">
              {imgs.length > 0 ? (
                <img src={imgs[imgIdx]} alt={product.name} key={imgIdx} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '.875rem' }}>
                  No image
                </div>
              )}
            </div>
            {imgs.length > 1 && (
              <div className="gal-thumbs">
                {imgs.map((src, i) => (
                  <div
                    key={i}
                    className={`thumb${imgIdx === i ? ' active' : ''}`}
                    onClick={() => setImgIdx(i)}
                  >
                    <img src={src} alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info & Sidebar */}
        <div className={isTopper ? "topper-sidebar" : ""}>
          <div className="info-title-row">
            <div>
              <h1 className="info-title">{product.name}</h1>
              <div className="sku-copy-row">
                <span>SKU: {product.sku}</span>
                <button className="sku-copy-btn" onClick={copySku} title="Click para copiar SKU">
                  {skuCopied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
            
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Share Menu */}
              <div style={{ position: 'relative' }}>
                <button className="share-expand-btn" onClick={() => setShowShare(!showShare)}>
                  <Share2 size={16} />
                </button>
                <AnimatePresence>
                  {showShare && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '50px',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        padding: '0.5rem',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-lg)',
                        display: 'flex',
                        gap: '0.5rem',
                        zIndex: 100
                      }}
                    >
                      {[
                        { Icon: Instagram, url: `https://instagram.com/berroastudio`, color: '#E4405F' },
                        { Icon: MessageCircle, url: getContactUrl('wa'), color: '#25D366' },
                        { Icon: Facebook, url: `https://facebook.com/berroastudio`, color: '#1877F2' },
                        { Icon: Mail, url: `mailto:?subject=${product.name}&body=${window.location.href}`, color: 'var(--muted)' },
                      ].map((item, i) => (
                        <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{ color: item.color }}>
                          <item.Icon size={18} />
                        </a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Heart Fav */}
              <div>
                <input 
                  type="checkbox" 
                  id="fav-toggle" 
                  className="fav-btn-input" 
                  checked={isFav} 
                  onChange={(e) => setIsFav(e.target.checked)} 
                />
                <label htmlFor="fav-toggle" className="fav-btn-label">
                  <Heart size={16} />
                  <div className="action">
                    <span className="option-1">Favorito</span>
                    <span className="option-2">¡Añadido!</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="tags" style={{ width: '100%' }}>
              {(product.tags || []).map(t => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>

          <div className="price-row">
            <span className="price-main">{fmt(unit, currency)}</span>
            {compareAt && compareAt > unit && (
              <>
                <span className="price-compare">{fmt(compareAt, currency)}</span>
                <span className="save-badge">Save {fmt(save, currency)}</span>
              </>
            )}
          </div>

          {product.description && !isTopper && (
            <p className="detail-desc">{product.description}</p>
          )}

          {/* Sizing description for toppers */}
          {isTopper && topperState && (
            <div className="topper-size-info">
               Este topper de tamaño <strong>{topperState.sizeLabel}</strong> incluye personalización de 2 líneas con la fuente <strong>{topperState.fontFamily}</strong>.
            </div>
          )}

          {/* Variants */}
          {!isTopper && (product.variants?.length ?? 0) > 0 && (
            <>
              <div className="sec"><Tag size={10} /> Variants</div>
              <VariantSelector product={product} onVariantChange={setSV} />
            </>
          )}

          {/* Features */}
          {features.length > 0 && (
            <>
              <div className="sec"><Star size={10} /> Highlight Features</div>
              <ul className="feat-list">
                {features.map((f: any, i: number) => {
                  const Icon = FEAT_ICONS[i % FEAT_ICONS.length];
                  return (
                    <li key={i} className="feat-li">
                      <Icon size={13} />
                      {typeof f === 'string' ? f : f.label}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {/* Dimensions */}
          {dimKeys.length > 0 && !isTopper && (
            <>
              <div className="sec"><Package size={10} /> Dimensions</div>
              <table className="dim-table">
                <thead>
                  <tr>
                    <th />
                    {['S', 'M', 'L', 'XL'].map(s => <th key={s}>{s}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {dimKeys.map(k => (
                    <tr key={k}>
                      <td>{k}</td>
                      {['S', 'M', 'L', 'XL'].map(s => (
                        <td key={s}>{(product.dimensions as any)?.[k]?.[s] ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Sustainability */}
          {sustainability.length > 0 && (
            <>
              <div className="sec"><Leaf size={10} /> Sustainability</div>
              <div className="sustain-box">
                {sustainability.map((s: string, i: number) => {
                  const I = [Leaf, Droplets, Recycle][i % 3];
                  return (
                    <div key={i} className="sustain-li">
                      <I size={13} /><span>{s}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Compatibility */}
          {compats.length > 0 && (
            <>
              <div className="sec"><Car size={10} /> Compatible con</div>
              <div className="compat-grid">
                {compats.map(c => {
                  const CompatIcon = c.item_type === 'motorcycle' || c.item_type === 'moto' ? Bike : Car;
                  const yearStr = c.year_from && c.year_to
                    ? `${c.year_from}–${c.year_to}`
                    : c.year_from ? `${c.year_from}+` : '';
                  return (
                    <div key={c.id} className="compat-item">
                      <CompatIcon size={14} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.78rem' }}>{c.brand} {c.model}</div>
                        <div style={{ fontSize: '.68rem', color: 'var(--muted)' }}>
                          {c.submodel && `${c.submodel} · `}{yearStr}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Add-ons */}
          <div className="sec"><Gift size={10} /> Add-ons & Services</div>
          <AddonBadges storeId={storeId} sel={addons} setSel={setAddons} currency={currency} />

          {/* Qty + CTA */}
          <div className="qty-row">
            <div className="qty-ctrl">
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>
                <Minus size={12} />
              </button>
              <span className="qty-num">{qty}</span>
              <button className="qty-btn" onClick={() => setQty(q => Math.min(stock, q + 1))}>
                <Plus size={12} />
              </button>
            </div>
            <span className={`stock-note${stock <= 3 ? ' low' : ''}`}>
              {stock <= 0
                ? '✗ Out of stock'
                : stock <= 3
                  ? `⚠ Only ${stock} left`
                  : isTopper ? 'Hecho a mano bajo pedido' : `${stock} in stock`}
            </span>
          </div>

          <button
            className="btn btn-solid btn-full"
            disabled={stock <= 0}
            onClick={() => onAddToCart(product, sv, addons, qty, isTopper ? topperState : undefined)}
          >
            <ShoppingBag size={13} /> Add to Cart · {fmt(total, currency)}
          </button>

          <div style={{
            marginTop: '.55rem',
            display: 'flex',
            alignItems: 'center',
            gap: '.4rem',
            fontSize: '.67rem',
            color: 'var(--muted)',
          }}>
            <Shield size={10} /> Secure checkout · {store.description}
          </div>

          <div className="contact-row">
            <a href={getContactUrl('wa', true)} target="_blank" rel="noreferrer" className="contact-btn wa">
              <MessageCircle size={14} /> Pide tu Cotización
            </a>
            <a href={getContactUrl('tg')} target="_blank" rel="noreferrer" className="contact-btn tg">
              <Send size={14} /> Info en Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
  .topper-layout {
     display: flex;
     flex-direction: column;
     gap: 2rem;
  }
  @media (min-width: 1100px) {
    .topper-layout { 
       display: grid; 
       grid-template-columns: 1fr 340px; 
       gap: 3rem;
    }
  }
  .topper-size-info {
     font-size: 0.82rem;
     background: var(--bg2);
     padding: 1rem;
     border-radius: var(--r);
     border-left: 3px solid var(--accent);
     margin-bottom: 1.5rem;
     line-height: 1.5;
  }
  .topper-sidebar {
     border: 1px solid var(--border);
     padding: 1.5rem;
     border-radius: var(--r-lg);
     background: var(--card);
     position: sticky;
     top: 100px;
  }
`;

document.head.appendChild(Object.assign(document.createElement('style'), { textContent: styles }));
