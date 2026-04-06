import { useState, useEffect } from 'react';
import {
  ChevronLeft, ShoppingBag, Shield, Tag, Star,
  Package, Leaf, Droplets, Recycle, Plus, Minus, Gift, Car, Bike,
} from 'lucide-react';
import { VariantSelector, AddonBadges } from './VariantSelector';
import { STORES, ADDON_DEFS, fmt, type StoreId, type Currency } from '../config/stores';
import { getProductPrice, getCompareAtPrice, getProductCompatibility, type ProductCompat } from '../lib/storefront-api';
import type { Product, Variant } from '../types/database';

interface ProductDetailProps {
  product: Product;
  storeId: StoreId;
  currency: Currency;
  onBack: () => void;
  onAddToCart: (product: Product, variant: Variant | null, addons: string[], qty: number) => void;
}

export function ProductDetail({ product, storeId, currency, onBack, onAddToCart }: ProductDetailProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [sv, setSV] = useState<Variant | null>(product.variants?.[0] || null);
  const [addons, setAddons] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [compats, setCompats] = useState<ProductCompat[]>([]);

  useEffect(() => {
    getProductCompatibility(product.id).then(setCompats).catch(() => {});
  }, [product.id]);

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
  const unit = getProductPrice(product, currency);
  const compareAt = getCompareAtPrice(product, currency);
  const total = (unit + addonAmt) * qty;
  const stock = sv?.inventory_quantity ?? 99;
  const save = compareAt && compareAt > unit ? compareAt - unit : 0;
  const store = STORES[storeId];

  // Icon map for features
  const FEAT_ICONS = [Star, Package, Leaf, Droplets, Recycle, ShoppingBag];

  return (
    <div className="detail-wrap">
      <div className="back" onClick={onBack}>
        <ChevronLeft size={13} /> All Products
      </div>

      <div className="detail-grid">
        {/* Gallery */}
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

        {/* Info */}
        <div>
          <div className="info-title-row">
            <h1 className="info-title">{product.name}</h1>
            <div className="tags">
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

          {product.description && (
            <p className="detail-desc">{product.description}</p>
          )}

          {/* Variants */}
          {(product.variants?.length ?? 0) > 0 && (
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
          {dimKeys.length > 0 && (
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
                  : `${stock} in stock`}
            </span>
          </div>

          <button
            className="btn btn-solid btn-full"
            disabled={stock <= 0}
            onClick={() => onAddToCart(product, sv, addons, qty)}
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
        </div>
      </div>
    </div>
  );
}
