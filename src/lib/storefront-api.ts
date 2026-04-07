// ============================================================
// BERROA STUDIO — STOREFRONT API
// Funciones públicas para el ecommerce. Solo usa anon key.
// RLS de Supabase protege el acceso: productos activos son
// públicos, órdenes/clientes requieren auth.
// ============================================================

import { supabase } from './supabase';
import type { Product, Variant, Customer, Order, OrderItem } from '../types/database';

export type Currency = 'USD' | 'DOP' | 'EUR';

// ─── Helpers ─────────────────────────────────────────────

/**
 * Obtiene el precio de un producto para la moneda seleccionada.
 * Usa price_usd, price_dop, price_eur directamente de la DB.
 * Sin conversión de moneda — precios exactos configurados en el backoffice.
 */
export function getProductPrice(product: Product, currency: Currency): number {
  switch (currency) {
    case 'DOP': return product.price_dop ?? product.price;
    case 'EUR': return product.price_eur ?? product.price;
    case 'USD':
    default:    return product.price_usd ?? product.price;
  }
}

export function getCompareAtPrice(product: Product, currency: Currency): number | null {
  // compare_at_price se mantiene como referencia en la moneda base (USD)
  // Si quieres compare prices por moneda, se puede extender el schema
  if (!product.compare_at_price) return null;
  // Calcular el compare proporcional si hay precios locales
  if (currency === 'DOP' && product.price_dop && product.price_usd) {
    const ratio = product.compare_at_price / product.price_usd;
    return product.price_dop * ratio;
  }
  if (currency === 'EUR' && product.price_eur && product.price_usd) {
    const ratio = product.compare_at_price / product.price_usd;
    return product.price_eur * ratio;
  }
  return product.compare_at_price;
}

// ─── Productos ──────────────────────────────────────────

/**
 * Obtiene todos los productos activos con sus variantes.
 */
export async function getActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      variants (*),
      categories!products_category_id_fkey (id, name, slug)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[storefront-api] getActiveProducts:', error);
    throw error;
  }

  // Map category name from join for convenience
  return (data || []).map((p: any) => ({
    ...p,
    category: p.categories?.name || p.category || null,
    category_slug: p.categories?.slug || null,
  })) as Product[];
}

/**
 * Obtiene el inventario actual para una variante o producto.
 */
export async function getInventory(variantId: string): Promise<{ quantity: number; reserved: number; available: number } | null> {
  const { data, error } = await supabase
    .from('inventory')
    .select('quantity, reserved, available_stock')
    .eq('variant_id', variantId)
    .single() as any;

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[storefront-api] getInventory:', error);
    return null;
  }

  return {
    quantity: data.quantity,
    reserved: data.reserved || 0,
    available: data.available_stock || (data.quantity - (data.reserved || 0))
  };
}

/**
 * Obtiene un producto por ID con sus variantes.
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      variants (*)
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows
    console.error('[storefront-api] getProductById:', error);
    throw error;
  }

  return data as Product | null;
}

/**
 * Obtiene las categorías desde la tabla categories.
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('[storefront-api] getCategories:', error);
    return [];
  }
  return (data || []) as Category[];
}

/**
 * Obtiene compatibilidad de un producto (carros, motos, etc.).
 */
export interface ProductCompat {
  id: string;
  item_type: string;
  brand: string;
  model: string;
  submodel: string | null;
  year_from: number | null;
  year_to: number | null;
  icon_key: string | null;
}

export async function getProductCompatibility(productId: string): Promise<ProductCompat[]> {
  const { data, error } = await supabase
    .from('product_compatibility')
    .select('*')
    .eq('product_id', productId)
    .order('brand', { ascending: true });

  if (error) {
    console.error('[storefront-api] getProductCompat:', error);
    return [];
  }
  return (data || []) as ProductCompat[];
}

/**
 * Obtiene todos los addons activos desde la DB.
 */
export interface StorefrontAddon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  price_usd: number;
  price_dop: number;
  price_eur: number;
  is_custom_design: boolean;
}

export async function getAddons(): Promise<StorefrontAddon[]> {
  const { data, error } = await supabase
    .from('addons')
    .select('id, code, name, description, icon, price_usd, price_dop, price_eur, is_custom_design')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[storefront-api] getAddons:', error);
    return [];
  }
  return (data || []) as StorefrontAddon[];
}

// ─── Clientes ────────────────────────────────────────────

/**
 * Upsert de cliente por email.
 * Se llama al hacer checkout para registrar o actualizar el cliente.
 */
export async function upsertCustomer(
  email: string,
  name?: string,
  phone?: string
): Promise<Customer | null> {
  const tenantId = await getDefaultTenantId();

  const { data, error } = await supabase
    .from('customers')
    .upsert(
      { email, name: name || null, phone: phone || null, tenant_id: tenantId } as any,
      { onConflict: 'email' }
    )
    .select()
    .single() as any;

  if (error) {
    console.error('[storefront-api] upsertCustomer:', error);
    return null;
  }

  return data as Customer;
}

// ─── Órdenes ─────────────────────────────────────────────

/**
 * Crea una orden completa en Supabase.
 * Se llama después del checkout de Stripe exitoso.
 */
export async function createOrder(
  orderData: Partial<Order>,
  items: Array<{
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
  }>
): Promise<Order | null> {
  const tenantId = await getDefaultTenantId();

  // 1. Crear la orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ ...orderData, tenant_id: tenantId } as any)
    .select()
    .single() as any;

  if (orderError) {
    console.error('[storefront-api] createOrder:', orderError);
    throw orderError;
  }

  // 2. Insertar order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    variant_id: item.variant_id || null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.quantity * item.unit_price,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems as any);

  if (itemsError) {
    console.error('[storefront-api] createOrderItems:', itemsError);
    throw itemsError;
  }

  return order as Order;
}

// ─── Tenant ──────────────────────────────────────────────

let _cachedTenantId: string | null = null;

export async function getDefaultTenantId(): Promise<string | null> {
  if (_cachedTenantId) return _cachedTenantId;

  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single() as any;

  if (error) {
    console.error('[storefront-api] getDefaultTenantId:', error);
    return null;
  }

  _cachedTenantId = data.id;
  return data.id;
}
