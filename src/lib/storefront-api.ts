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
      variants (*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[storefront-api] getActiveProducts:', error);
    throw error;
  }

  return (data || []) as Product[];
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
 * Obtiene las categorías únicas de los productos activos.
 */
export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('status', 'active')
    .not('category', 'is', null);

  if (error) return [];
  const cats = [...new Set((data || []).map(r => r.category).filter(Boolean))] as string[];
  return cats.sort();
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
      { email, name: name || null, phone: phone || null, tenant_id: tenantId },
      { onConflict: 'email' }
    )
    .select()
    .single();

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
    .single();

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
    .single();

  if (error) {
    console.error('[storefront-api] getDefaultTenantId:', error);
    return null;
  }

  _cachedTenantId = data.id;
  return data.id;
}
