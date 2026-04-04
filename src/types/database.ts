// ============================================================
// BERROA STUDIO — DATABASE TYPES
// Refleja el schema real de Supabase (incluyendo price_usd,
// price_dop, price_eur añadidos al products table)
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Product Media ───────────────────────────────────────
export interface ProductMedia {
  images: string[];
  video?: string;
}

// ─── Product Feature ─────────────────────────────────────
export interface ProductFeature {
  label: string;
  icon?: string;
}

// ─── Variant Attributes ──────────────────────────────────
export interface VariantAttributes {
  size?: string;
  color?: string;
  scent?: string;
  strap?: string;
  length?: string;
  [key: string]: string | undefined;
}

// ─── Variant ─────────────────────────────────────────────
export interface Variant {
  id: string;
  product_id: string | null;
  sku: string | null;
  attributes: VariantAttributes | null;
  price: number | null;
  inventory_quantity: number;
  image_url: string | null;
  created_at: string;
}

// ─── Product (from Supabase, includes variants join) ─────
export interface Product {
  id: string;
  tenant_id: string | null;
  sku: string;
  name: string;
  description: string | null;
  // Base price (USD equivalent for legacy)
  price: number;
  compare_at_price: number | null;
  cost_per_item: number | null;
  // Multi-currency prices (columnas nuevas añadidas)
  price_usd: number | null;
  price_dop: number | null;
  price_eur: number | null;
  category: string | null;
  tags: string[] | null;
  weight_grams: number | null;
  dimensions: Json | null;
  features: Json | null;
  sustainability: Json | null;
  media: ProductMedia | null;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  // Joined
  variants?: Variant[];
}

// ─── Customer ─────────────────────────────────────────────
export interface Customer {
  id: string;
  tenant_id: string | null;
  stripe_customer_id: string | null;
  email: string;
  name: string | null;
  phone: string | null;
  shipping_address: Json | null;
  billing_address: Json | null;
  total_spent: number;
  last_order_at: string | null;
  created_at: string;
}

// ─── Order ────────────────────────────────────────────────
export interface Order {
  id: string;
  tenant_id: string | null;
  customer_id: string | null;
  status: string;
  payment_status: string;
  subtotal: number | null;
  tax: number | null;
  shipping_cost: number | null;
  discount: number | null;
  total: number | null;
  currency: string;
  stripe_payment_intent_id: string | null;
  stripe_payment_id: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

// ─── Order Item ───────────────────────────────────────────
export interface OrderItem {
  id: string;
  order_id: string | null;
  product_id: string | null;
  variant_id: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
}

// ─── Promotion ────────────────────────────────────────────
export interface Promotion {
  id: string;
  tenant_id: string | null;
  code: string | null;
  type: 'percentage' | 'fixed' | null;
  value: number | null;
  min_purchase: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Supabase Database Types ───────────────────────────────
export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Partial<Product>;
        Update: Partial<Product>;
      };
      variants: {
        Row: Variant;
        Insert: Partial<Variant>;
        Update: Partial<Variant>;
      };
      customers: {
        Row: Customer;
        Insert: Partial<Customer>;
        Update: Partial<Customer>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Order>;
        Update: Partial<Order>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem>;
        Update: Partial<OrderItem>;
      };
      promotions: {
        Row: Promotion;
        Insert: Partial<Promotion>;
        Update: Partial<Promotion>;
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
