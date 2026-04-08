import { useEffect } from 'react';
import { useState } from 'react';
import { STORES, ADDON_DEFS, COLOR_MAP, fmt, uniqAttrVals } from '../config/stores';
import type { StoreId, Currency } from '../config/stores';
import type { Product, Variant } from '../types/database';

// ─── VariantSelector ─────────────────────────────────────

interface VariantSelectorProps {
  product: Product;
  onVariantChange: (v: Variant | null) => void;
}

export function VariantSelector({ product, onVariantChange }: VariantSelectorProps) {
  const variants = product.variants || [];
  const attrKeys = [...new Set(variants.flatMap(v => Object.keys(v.attributes || {})))];
  
  const [sel, setSel] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    attrKeys.forEach(k => {
      const firstVal = variants[0]?.attributes?.[k];
      if (firstVal) init[k] = firstVal;
    });
    return init;
  });

  useEffect(() => {
    const match = variants.find(v =>
      attrKeys.every(k => v.attributes?.[k] === sel[k])
    );
    onVariantChange(match || null);
  }, [sel]); // eslint-disable-line

  const isAvailable = (key: string, val: string) => {
    const test = { ...sel, [key]: val };
    return variants.some(
      v => attrKeys.every(k => v.attributes?.[k] === test[k]) && (v.inventory_quantity ?? 0) > 0
    );
  };

  if (attrKeys.length === 0) return null;

  return (
    <>
      {attrKeys.map(key => (
        <div key={key} className="var-group">
          <div className="var-label">
            {key}: <strong style={{ color: 'var(--text)' }}>{sel[key]}</strong>
          </div>
          <div className="var-opts">
            {key === 'color' ? (
              <div className="container-items">
                {uniqAttrVals(variants, key).map(val => (
                  <button
                    key={val}
                    aria-label={val}
                    className={`item-color${sel[key] === val ? ' active' : ''}`}
                    style={{ '--color': COLOR_MAP[val] || val } as any}
                    disabled={!isAvailable(key, val)}
                    onClick={() => setSel(s => ({ ...s, [key]: val }))}
                  />
                ))}
              </div>
            ) : (
              uniqAttrVals(variants, key).map(val => (
                <button
                  key={val}
                  className={`var-btn${sel[key] === val ? ' active' : ''}`}
                  disabled={!isAvailable(key, val)}
                  onClick={() => setSel(s => ({ ...s, [key]: val }))}
                >
                  {val}
                </button>
              ))
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// ─── AddonBadges ─────────────────────────────────────────

interface AddonBadgesProps {
  storeId: StoreId;
  sel: string[];
  setSel: React.Dispatch<React.SetStateAction<string[]>>;
  currency: Currency;
}

import { Check } from 'lucide-react';

export function AddonBadges({ storeId, sel, setSel, currency }: AddonBadgesProps) {
  const store = STORES[storeId];
  return (
    <div className="addons-grid">
      {store.addons.map(id => {
        const d = ADDON_DEFS[id];
        const price = d.price[currency];
        const on = sel.includes(id);
        return (
          <button
            key={id}
            className={`addon-badge${on ? ' sel' : ''}`}
            onClick={() => setSel(p => on ? p.filter(x => x !== id) : [...p, id])}
          >
            <d.Icon size={14} />
            <div className="ab-info">
              <div className="ab-name">{d.label}</div>
              <div className="ab-price">{price === 0 ? 'Gratis' : `+${fmt(price, currency)}`}</div>
            </div>
            <div className="ab-check">{on && <Check size={9} strokeWidth={3} />}</div>
          </button>
        );
      })}
    </div>
  );
}
