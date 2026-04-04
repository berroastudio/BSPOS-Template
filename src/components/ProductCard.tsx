import { ShoppingBag } from 'lucide-react';
import { fmt, type Currency } from '../config/stores';
import { getProductPrice, getCompareAtPrice } from '../lib/storefront-api';
import type { Product, Variant } from '../types/database';

interface CartItem {
  product: Product;
  variant: Variant | null;
  addons: string[];
  qty: number;
}

interface ProductCardProps {
  product: Product;
  idx: number;
  currency: Currency;
  onClick: (p: Product) => void;
  onAddToCart: (product: Product, variant: Variant | null, addons: string[], qty: number) => void;
}

export function ProductCard({ product, idx, currency, onClick, onAddToCart }: ProductCardProps) {
  const price = getProductPrice(product, currency);
  const compareAt = getCompareAtPrice(product, currency);
  const firstImage = (product.media as any)?.images?.[0];

  return (
    <div
      className="card"
      style={{ animationDelay: `${idx * 0.04}s` }}
      onClick={() => onClick(product)}
    >
      <div className="card-img">
        {firstImage ? (
          <img src={firstImage} alt={product.name} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '.7rem' }}>
            Sin imagen
          </div>
        )}
      </div>
      <h3 className="card-title">{product.name}</h3>
      <div className="tags">
        {(product.tags || []).map(t => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>
      <div className="card-price">
        {fmt(price, currency)}
        {compareAt && compareAt > price && (
          <span className="price-orig">{fmt(compareAt, currency)}</span>
        )}
      </div>
      <button
        className="btn btn-full"
        onClick={e => {
          e.stopPropagation();
          onAddToCart(product, null, [], 1);
        }}
      >
        <ShoppingBag size={12} /> Add to Cart
      </button>
    </div>
  );
}

export type { CartItem };
