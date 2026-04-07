import { supabase } from './supabase';
import type { Order, Customer } from '../types/database';

/**
 * Obtiene el historial de órdenes de un cliente basado en su email.
 */
export async function getCustomerOrders(email: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('customer_email', email)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[customer-api] getCustomerOrders:', error);
    return [];
  }
  return data as Order[];
}

/**
 * Obtiene el perfil de un cliente en Supabase basado en su email.
 */
export async function getCustomerProfile(email: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[customer-api] getCustomerProfile:', error);
    return null;
  }
  return data as Customer;
}

/**
 * Actualiza el perfil del cliente (incluyendo RNC y Razón Social).
 */
export async function updateCustomerProfile(id: string, updates: Partial<Customer>): Promise<boolean> {
  const { error } = await supabase
    .from('customers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[customer-api] updateCustomerProfile:', error);
    return false;
  }
  return true;
}

/**
 * Asegura que el cliente exista en Supabase. Si no existe, lo crea.
 * Útil para sincronizar con Clerk.
 */
export async function syncCustomerWithSupabase(clerkUser: any): Promise<Customer | null> {
  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) return existing;

  // Si no existe, crear con info de Clerk
  const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();

  const { data, error } = await supabase
    .from('customers')
    .insert({
      email,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      tenant_id: tenant?.id,
      source: 'website' // Badge: Website
    } as any)
    .select()
    .single();

  if (error) {
    console.error('[customer-api] syncCustomer:', error);
    return null;
  }

  return data as Customer;
}
