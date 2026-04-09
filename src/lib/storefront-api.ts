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
 * Primero intenta desde la tabla inventory, luego usa inventory_quantity de variants.
 */
export async function getInventory(variantId: string): Promise<{ quantity: number; reserved: number; available: number } | null> {
  console.log(`[storefront-api] Fetching inventory for variant: ${variantId}`);
  try {
    // Intentar desde tabla inventory primero (sumar todas las ubicaciones/tiendas)
    const { data: invRows, error: invError } = await supabase
      .from('inventory')
      .select('quantity, reserved')
      .eq('variant_id', variantId);

    if (invError) {
      console.error('[storefront-api] Inventory table error (Possible RLS issue):', invError.message);
    }

    if (invRows && invRows.length > 0) {
      const totals = invRows.reduce((acc, row) => ({
        quantity: acc.quantity + (row.quantity || 0),
        reserved: acc.reserved + (row.reserved || 0),
      }), { quantity: 0, reserved: 0 });

      console.log(`[storefront-api] Table 'inventory' totals:`, totals);
      return {
        quantity: totals.quantity,
        reserved: totals.reserved,
        available: Math.max(0, totals.quantity - totals.reserved)
      };
    }

    console.log(`[storefront-api] No rows in 'inventory', falling back to variant stock.`);

    // Fallback: obtener desde variants.inventory_quantity
    const { data: variantData, error: variantError } = await supabase
      .from('variants')
      .select('inventory_quantity')
      .eq('id', variantId)
      .single() as any;

    if (variantError) {
      console.error('[storefront-api] Variant table error:', variantError.message);
    }

    if (variantData) {
      const qty = variantData.inventory_quantity || 0;
      return {
        quantity: qty,
        reserved: 0,
        available: qty
      };
    }

    console.warn(`[storefront-api] No inventory findings for variant ${variantId}`);
    return null;
  } catch (error) {
    console.error('[storefront-api] getInventory fatal error:', error);
    return null;
  }
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

  // Calculate totals from items
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const tax = Number(orderData.tax) || 0;
  const shippingCost = Number(orderData.shipping_cost) || 0;
  const discount = Number(orderData.discount) || 0;
  
  // Set total_amount if not provided
  const totalAmount = orderData.total_amount || (subtotal - discount + tax + shippingCost);

  // 1. Create order with complete financial data
  const orderPayload = {
    ...orderData,
    tenant_id: tenantId,
    subtotal,
    tax: tax || Number(orderData.tax) || 0,
    shipping_cost: shippingCost,
    discount: discount,
    total_amount: totalAmount,
    total: totalAmount // Ensure both fields are set
  };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderPayload as any)
    .select()
    .single() as any;

  if (orderError) {
    console.error('[storefront-api] createOrder:', orderError);
    throw orderError;
  }

  // 2. Insert order items
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

/**
 * Crea una cotización especial para un diseño de Topper Personalizado.
 */
export async function createTopperQuote(payload: {
  customer_name: string;
  customer_whatsapp: string;
  address: string;
  design_data: any;
  total: number;
  notes?: string;
  country: string;
}) {
  const tenantId = await getDefaultTenantId();

  const { data: quote, error } = await (supabase as any)
    .from('quotes')
    .insert({
      customer_name: payload.customer_name,
      customer_email: 'topper@guest.com', // Placeholder
      status: 'sent',
      total_amount: payload.total,
      notes: `${payload.notes || ''} [WhatsApp: ${payload.customer_whatsapp}] [Dirección: ${payload.address}] [País: ${payload.country}]`,
      design_data: payload.design_data,
      tenant_id: tenantId,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('[storefront-api] createTopperQuote:', error);
    throw error;
  }

  // ─────────────────────────────────────────
  // 3. NOTIFICAR AL ADMIN (Realtime Alert)
  // ─────────────────────────────────────────
  if (quote) {
    await (supabase as any).from('notifications').insert({
      tenant_id: tenantId,
      title: '🎂 Nueva Producción: Topper',
      message: `Solicitud de ${payload.customer_name} recibida.`,
      type: 'topper',
      action_url: `/topper`
    });
  }

  return quote;
}

// ─── Shipping ────────────────────────────────────────────

/**
 * Obtiene los carriers disponibles filtrados por país.
 */
export async function getShippingCarriers(filters?: { country?: string }) {
  let query = supabase.from('shipping_carriers').select('*').eq('is_active', true);
  if (filters?.country) {
    query = query.or(`country.eq.${filters.country},country.eq.ALL`);
  }
  const { data, error } = await query.order('name', { ascending: true });
  if (error) {
    console.error('[storefront-api] getShippingCarriers:', error);
    return [];
  }
  return data || [];
}

/**
 * Obtiene los puntos de recogida (Pickup Points) o localidades.
 */
export async function getShippingLocations(filters?: { is_pickup_point?: boolean; municipality?: string }) {
  let query = supabase.from('shipping_locations').select('*').eq('is_active', true);
  if (filters?.is_pickup_point !== undefined) query = query.eq('is_pickup_point', filters.is_pickup_point);
  if (filters?.municipality) query = query.ilike('municipality', `%${filters.municipality}%`);
  const { data, error } = await query.order('municipality', { ascending: true });
  if (error) {
    console.error('[storefront-api] getShippingLocations:', error);
    return [];
  }
  return data || [];
}

/**
 * Calcula o busca la tarifa de envío basada en carrier y peso.
 */
export async function getShippingRates(filters?: { carrier_id?: string; zone_id?: string; weight_lb?: number }) {
  let query = supabase.from('shipping_rates').select('*, shipping_carriers(code, name)');
  if (filters?.carrier_id) query = query.eq('carrier_id', filters.carrier_id);
  if (filters?.zone_id) query = query.eq('zone_id', filters.zone_id);
  
  if (filters?.weight_lb !== undefined) {
    query = query.lte('weight_lb_min', filters.weight_lb).gte('weight_lb_max', filters.weight_lb);
  }

  const { data, error } = await query.order('price_usd', { ascending: true });
  if (error) {
    console.error('[storefront-api] getShippingRates:', error);
    return [];
  }
  return data || [];
}

/**
 * Obtiene manuales de instrucciones vinculados a un SKU específico.
 */
export async function getInstructionsBySku(sku: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('product_instructions')
      .select('*, steps:instruction_steps(*)')
      .contains('linked_skus', [sku])
      .eq('is_public', true);

    if (error) throw error;
    return (data || []).map(ins => ({
      ...ins,
      steps: (ins.steps || []).sort((a: any, b: any) => a.step_number - b.step_number)
    }));
  } catch (err) {
    console.error('[storefront-api] getInstructionsBySku:', err);
    return [];
  }
}
