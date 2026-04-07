// ============================================================
// BERROA STUDIO — Store Config & Addon Definitions
// Configuración global del storefront: tiendas y add-ons
// ============================================================

import {
  Shapes, Gift, Zap, Truck, Store,
} from 'lucide-react';
import type { ElementType } from 'react';
import type { Currency } from '../lib/storefront-api';
export type { Currency };

// ─── Store Config ─────────────────────────────────────────

export type StoreId = 'usa' | 'rd';

export interface StoreConfig {
  id: StoreId;
  name: string;
  subtitle: string;
  flag: string;
  currency: Currency;
  country: string;
  description: string;
  addons: string[];
  tax_rate?: number;
  tenant_id: string;
}

export const STORES: Record<StoreId, StoreConfig> = {
  usa: {
    id: 'usa',
    name: 'Berroa Studio',
    subtitle: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    country: 'US',
    description: 'Worldwide shipping from New York',
    addons: ['personalization', 'gift_wrap', 'same_day', 'shipping'],
    tenant_id: '685b0373-1002-4148-8df0-eec1287114b3', // USA (Mock or Actual if known)
  },
  rd: {
    id: 'rd',
    name: 'Berroa Studio',
    subtitle: 'República Dominicana',
    flag: '🇩🇴',
    currency: 'DOP',
    country: 'DO',
    tax_rate: 18,
    description: 'Punto físico en Herrera, Santo Domingo',
    addons: ['personalization', 'gift_wrap', 'pickup', 'shipping'],
    tenant_id: '685b0373-1002-4148-8df0-eec1287114b3', // Main tenant (Dominican Republic)
  },
};

// ─── Addon Definitions ───────────────────────────────────

export interface AddonDef {
  id: string;
  label: string;
  desc: string;
  price: Record<Currency, number>;
  Icon: ElementType;
}

export const ADDON_DEFS: Record<string, AddonDef> = {
  personalization: {
    id: 'personalization',
    label: 'Personalización',
    desc: 'Texto o monograma bordado',
    price: { USD: 12, DOP: 700, EUR: 11 },
    Icon: Shapes,
  },
  gift_wrap: {
    id: 'gift_wrap',
    label: 'Gift Wrap',
    desc: 'Empaque especial para regalo',
    price: { USD: 5, DOP: 290, EUR: 5 },
    Icon: Gift,
  },
  same_day: {
    id: 'same_day',
    label: 'Same-Day Shipping',
    desc: 'Entrega el mismo día (área NYC)',
    price: { USD: 18, DOP: 0, EUR: 16 },
    Icon: Zap,
  },
  shipping: {
    id: 'shipping',
    label: 'Standard Shipping',
    desc: 'Envío estándar 3-5 días',
    price: { USD: 8, DOP: 450, EUR: 7 },
    Icon: Truck,
  },
  pickup: {
    id: 'pickup',
    label: 'Pick-up en Tienda',
    desc: 'Retira en Herrera, gratis',
    price: { USD: 0, DOP: 0, EUR: 0 },
    Icon: Store,
  },
};

// ─── Color Map for variant swatches ───────────────────────

export const COLOR_MAP: Record<string, string> = {
  White: '#f5f5f0',
  Blue: '#6b8cba',
  Khaki: '#c4b898',
  Black: '#222',
  Tan: '#c4956a',
  Grey: '#b0b0aa',
  Cream: '#f5f0e8',
  Olive: '#7c8c5a',
  Red: '#c0392b',
  Navy: '#2c3e6b',
  Brown: '#795548',
  Green: '#4caf50',
};

// ─── Formatter ────────────────────────────────────────────

export const fmt = (n: number, c: Currency): string =>
  new Intl.NumberFormat(c === 'DOP' ? 'es-DO' : c === 'EUR' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: c,
    minimumFractionDigits: 0,
  }).format(n);

// ─── Helpers ──────────────────────────────────────────────

export const getVarKey = (a: Record<string, string | undefined> | null): string =>
  Object.values(a || {}).filter(Boolean).join(' · ');

export const uniqAttrVals = (
  variants: Array<{ attributes: Record<string, string | undefined> | null }>,
  key: string
): string[] =>
  [...new Set(variants.map(v => v.attributes?.[key]).filter(Boolean))] as string[];
