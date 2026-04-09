// Multi-Store Inventory API
// Purpose: Query inventory availability by store and handle out-of-stock
// Location: BS-ECOMM-Front/bs-ecomm/src/lib/inventory-api.ts

import { supabase } from './supabase';
import { getDefaultTenantId } from './storefront-api';

const STORE_REGION = import.meta.env.VITE_STORE_REGION || 'RD';
console.log('[inventory-api] Active Region:', STORE_REGION);

// ============================================================================
// 1. GET INVENTORY BY STORE AND VARIANT
// ============================================================================

export async function getInventoryByStore(
  variantId: string,
  storeId?: string
): Promise<{
  variantId: string;
  storeId?: string;
  quantity: number;
  reserved: number;
  available: number;
  isAvailable: boolean;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  message: string;
} | null> {
  try {
    const tenantId = await getDefaultTenantId();
    if (!tenantId) {
      console.warn('[inventory-api] No tenant found');
      return null;
    }

    let query = supabase
      .from('inventory')
      .select('id, quantity, reserved, is_available, store_id, minimum_stock, store_locations!inner(region)')
      .eq('tenant_id', tenantId)
      .eq('variant_id', variantId)
      .eq('store_locations.region', STORE_REGION);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data: inventories, error } = await query;

    if (error || !inventories || inventories.length === 0) {
      console.warn(`[inventory-api] No inventory for variant ${variantId} in region ${STORE_REGION}`);
      return {
        variantId,
        storeId,
        quantity: 0,
        reserved: 0,
        available: 0,
        isAvailable: false,
        status: 'OUT_OF_STOCK',
        message: 'Producto agotado en esta región',
      };
    }

    // Sum quantities from all stores in the region
    const totalQty = inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
    const totalReserved = inventories.reduce((sum, inv) => sum + (inv.reserved || 0), 0);
    const available = totalQty - totalReserved;
    const isOutOfStock = available <= 0;
    const minStock = inventories[0]?.minimum_stock || 10;
    const isLowStock = available > 0 && available < minStock;

    let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
    let message = `${available} unidades disponibles`;

    if (isOutOfStock) {
      status = 'OUT_OF_STOCK';
      message = 'Producto agotado';
    } else if (isLowStock) {
      status = 'LOW_STOCK';
      message = `Solo ${available} unidades disponibles`;
    }

    return {
      variantId,
      storeId,
      quantity: totalQty,
      reserved: totalReserved,
      available: Math.max(0, available),
      isAvailable: inventories.some(i => i.is_available) && !isOutOfStock,
      status,
      message,
    };
  } catch (error) {
    console.error('[inventory-api] Error getting inventory:', error);
    return null;
  }
}

// ============================================================================
// 2. GET AVAILABILITY FOR MULTIPLE VARIANTS
// ============================================================================

export async function getInventoryMultiple(
  variantIds: string[],
  storeId?: string
): Promise<Map<string, any>> {
  try {
    const tenantId = await getDefaultTenantId();
    if (!tenantId) return new Map();

    const { data: inventories, error } = await supabase
      .from('inventory')
      .select('variant_id, quantity, reserved, is_available, minimum_stock, store_id, store_locations!inner(region)')
      .eq('tenant_id', tenantId)
      .in('variant_id', variantIds)
      .eq('store_locations.region', STORE_REGION)
      .order('variant_id');

    if (error) {
      console.error('[inventory-api] Error getting multiple inventory:', error);
      return new Map();
    }

    const map = new Map();
    const grouped = new Map<string, any[]>();

    // Group by variant_id
    inventories.forEach((inv) => {
      if (!grouped.has(inv.variant_id)) {
        grouped.set(inv.variant_id, []);
      }
      grouped.get(inv.variant_id)!.push(inv);
    });

    // Process each variant
    grouped.forEach((invList, variantId) => {
      // If storeId specified, find that store's inventory
      let inventory = invList.find((i) => i.store_id === storeId);
      // Otherwise take first available
      if (!inventory) {
        inventory = invList[0];
      }

      const available = (inventory.quantity || 0) - (inventory.reserved || 0);
      const status =
        available <= 0
          ? 'OUT_OF_STOCK'
          : available < (inventory.minimum_stock || 10)
            ? 'LOW_STOCK'
            : 'IN_STOCK';

      map.set(variantId, {
        available: Math.max(0, available),
        quantity: inventory.quantity || 0,
        reserved: inventory.reserved || 0,
        isAvailable: inventory.is_available && available > 0,
        status,
        storeId: inventory.store_id,
      });
    });

    return map;
  } catch (error) {
    console.error('[inventory-api] Error getting multiple inventory:', error);
    return new Map();
  }
}

// ============================================================================
// 3. GET PRODUCT-STORE ASSOCIATIONS
// ============================================================================

export async function getProductStoreAssociations(productId: string) {
  try {
    const tenantId = await getDefaultTenantId();
    if (!tenantId) return [];

    const { data: associations, error } = await supabase
      .from('product_store_mapping')
      .select(
        `
        id,
        store_id,
        is_active,
        min_stock_threshold,
        max_stock_threshold,
        store_locations(id, name, city, address)
      `
      )
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .eq('is_active', true);

    if (error) {
      console.error('[inventory-api] Error getting product-store mappings:', error);
      return [];
    }

    return associations || [];
  } catch (error) {
    console.error('[inventory-api] Error:', error);
    return [];
  }
}

// ============================================================================
// 4. GET STORES WITH AVAILABLE INVENTORY
// ============================================================================

export async function getStoresWithAvailableInventory(variantId: string) {
  try {
    const tenantId = await getDefaultTenantId();
    if (!tenantId) return [];

    const { data: stores, error } = await supabase
      .from('inventory')
      .select(
        `
        id,
        quantity,
        reserved,
        store_id,
        store_locations!inner(id, name, city, address, phone, region)
      `
      )
      .eq('tenant_id', tenantId)
      .eq('variant_id', variantId)
      .eq('store_locations.region', STORE_REGION)
      .gt('quantity', 0) // Has stock
      .order('quantity', { ascending: false });

    if (error) {
      console.error('[inventory-api] Error getting stores with inventory:', error);
      return [];
    }

    return (stores || []).map((store) => ({
      storeId: store.store_id,
      storeName: store.store_locations?.name || 'Unknown Store',
      city: store.store_locations?.city,
      address: store.store_locations?.address,
      phone: store.store_locations?.phone,
      available: Math.max(0, (store.quantity || 0) - (store.reserved || 0)),
      quantity: store.quantity,
    }));
  } catch (error) {
    console.error('[inventory-api] Error:', error);
    return [];
  }
}

// ============================================================================
// 5. CHECK BULK AVAILABILITY (Cart items)
// ============================================================================

export async function checkCartAvailability(
  items: Array<{ variantId: string; quantity: number }>,
  storeId?: string
): Promise<{
  available: boolean;
  unavailableItems: Array<{
    variantId: string;
    requested: number;
    available: number;
    message: string;
  }>;
  availableItems: Array<{
    variantId: string;
    quantity: number;
  }>;
}> {
  try {
    const tenantId = await getDefaultTenantId();
    if (!tenantId) {
      return {
        available: false,
        unavailableItems: items.map((i) => ({
          variantId: i.variantId,
          requested: i.quantity,
          available: 0,
          message: 'No tenant found',
        })),
        availableItems: [],
      };
    }

    const variantIds = items.map((i) => i.variantId);
    let query = supabase
      .from('inventory')
      .select('variant_id, quantity, reserved')
      .eq('tenant_id', tenantId)
      .in('variant_id', variantIds);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data: inventories } = await query;

    const inventoryMap = new Map(
      (inventories || []).map((inv) => [
        inv.variant_id,
        {
          available: Math.max(0, (inv.quantity || 0) - (inv.reserved || 0)),
        },
      ])
    );

    const unavailableItems: any[] = [];
    const availableItems: any[] = [];

    items.forEach((item) => {
      const inv = inventoryMap.get(item.variantId);
      const available = inv?.available || 0;

      if (available < item.quantity) {
        unavailableItems.push({
          variantId: item.variantId,
          requested: item.quantity,
          available,
          message:
            available === 0
              ? 'Producto agotado'
              : `Solo ${available} disponibles (solicitaste ${item.quantity})`,
        });
      } else {
        availableItems.push({
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }
    });

    return {
      available: unavailableItems.length === 0,
      unavailableItems,
      availableItems,
    };
  } catch (error) {
    console.error('[inventory-api] Error checking cart availability:', error);
    return {
      available: false,
      unavailableItems: items.map((i) => ({
        variantId: i.variantId,
        requested: i.quantity,
        available: 0,
        message: 'Error checking availability',
      })),
      availableItems: [],
    };
  }
}

// ============================================================================
// 6. DEDUCT INVENTORY (After payment)
// ============================================================================

export async function deductInventoryOnOrder(
  variantId: string,
  quantity: number,
  orderId: string,
  storeId?: string
): Promise<{
  success: boolean;
  message: string;
  remaining?: number;
}> {
  try {
    const tenantId = await getDefaultTenantId();
    if (!tenantId) {
      return { success: false, message: 'No tenant found' };
    }

    // Use the stored procedure to deduct inventory
    const { data, error } = await supabase.rpc('deduct_inventory_on_order', {
      p_tenant_id: tenantId,
      p_variant_id: variantId,
      p_quantity: quantity,
      p_store_id: storeId || null,
      p_order_id: orderId,
    });

    if (error) {
      console.error('[inventory-api] Error deducting inventory:', error);
      return {
        success: false,
        message: error.message || 'Failed to deduct inventory',
      };
    }

    if (!data.success) {
      return {
        success: false,
        message: data.error || 'Insufficient inventory',
        remaining: data.available,
      };
    }

    return {
      success: true,
      message: 'Stock deducted successfully',
      remaining: data.available_after,
    };
  } catch (error) {
    console.error('[inventory-api] Error:', error);
    return {
      success: false,
      message: 'Error deducting inventory',
    };
  }
}

// ============================================================================
// 7. GET INVENTORY STATUS FOR PRODUCT DETAIL
// ============================================================================

export async function getProductInventoryStatus(variantId: string) {
  try {
    const inventory = await getInventoryByStore(variantId);

    if (!inventory) {
      return {
        status: 'OUT_OF_STOCK',
        message: 'Producto no disponible',
        canPurchase: false,
        available: 0,
        showOutOfStockBanner: true,
        suggestAlternatives: true,
      };
    }

    const { available, status, isAvailable } = inventory;

    return {
      status,
      message: inventory.message,
      canPurchase: isAvailable && available > 0,
      available,
      showOutOfStockBanner: status === 'OUT_OF_STOCK',
      suggestAlternatives: status === 'OUT_OF_STOCK',
      urgencyMessage:
        status === 'LOW_STOCK' ? `¡Solo ${available} disponibles!` : null,
    };
  } catch (error) {
    console.error('[inventory-api] Error:', error);
    return {
      status: 'OUT_OF_STOCK',
      message: 'Error verificando disponibilidad',
      canPurchase: false,
      available: 0,
      showOutOfStockBanner: true,
      suggestAlternatives: true,
    };
  }
}
