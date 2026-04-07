// Stock Availability Component
// Purpose: Display inventory status and handle out-of-stock scenarios
// Location: BS-ECOMM-Front/bs-ecomm/src/components/StockAvailability.tsx

import { useEffect, useState } from 'react';
import {
  getProductInventoryStatus,
  getStoresWithAvailableInventory,
  checkCartAvailability,
} from '../lib/inventory-api';

// ============================================================================
// STOCK STATUS BADGE - Inline status indicator
// ============================================================================

export function StockStatusBadge({
  variantId,
  className = '',
}: {
  variantId: string;
  className?: string;
}) {
  const [status, setStatus] = useState<{
    status: string;
    available: number;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      const inventoryStatus = await getProductInventoryStatus(variantId);
      setStatus({
        status: inventoryStatus.status,
        available: inventoryStatus.available,
        message: inventoryStatus.message,
      });
      setLoading(false);
    };
    loadStatus();
  }, [variantId]);

  if (loading) return <div className={`badge badge-loading ${className}`}>Cargando...</div>;

  if (!status) return null;

  const statusColors = {
    IN_STOCK: 'bg-green-100 text-green-800 border-green-300',
    LOW_STOCK: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    OUT_OF_STOCK: 'bg-red-100 text-red-800 border-red-300',
  };

  const statusIcons = {
    IN_STOCK: '✓',
    LOW_STOCK: '⚠️',
    OUT_OF_STOCK: '✗',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
        statusColors[status.status as keyof typeof statusColors]
      } ${className}`}
    >
      <span>{statusIcons[status.status as keyof typeof statusIcons]}</span>
      <span>{status.message}</span>
    </div>
  );
}

// ============================================================================
// OUT OF STOCK BANNER - Full width alert
// ============================================================================

export function OutOfStockBanner({
  variantId,
  onShowAlternatives,
}: {
  variantId: string;
  onShowAlternatives?: () => void;
}) {
  const [inventory, setInventory] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const inventoryStatus = await getProductInventoryStatus(variantId);
      setInventory(inventoryStatus);

      if (inventoryStatus.suggestAlternatives) {
        const availableStores = await getStoresWithAvailableInventory(variantId);
        setStores(availableStores);
      }

      setLoading(false);
    };
    loadData();
  }, [variantId]);

  if (loading || !inventory?.showOutOfStockBanner) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📦</span>
        <div className="flex-1">
          <h3 className="font-bold text-red-900 mb-2">Producto Agotado</h3>
          <p className="text-red-800 mb-3">
            Lamentablemente este producto no está disponible en este momento.
          </p>

          {stores.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-red-700 font-medium mb-2">
                Pero está disponible en estas tiendas:
              </p>
              <div className="space-y-2">
                {stores.map((store) => (
                  <div key={store.storeId} className="text-sm bg-white p-2 rounded">
                    <div className="font-medium text-gray-900">{store.storeName}</div>
                    <div className="text-gray-600">
                      {store.city && <span>{store.city} • </span>}
                      {store.available} unidades disponibles
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {onShowAlternatives && (
              <button
                onClick={onShowAlternatives}
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
              >
                Ver Productos Similares
              </button>
            )}
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition">
              Notificarme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CART AVAILABILITY CHECKER - Check before checkout
// ============================================================================

export function CartAvailabilityChecker({
  items,
  onProceed,
  onError,
}: {
  items: Array<{ variantId: string; quantity: number; name?: string }>;
  onProceed: () => void;
  onError: (errors: any[]) => void;
}) {
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);

  const handleCheckAvailability = async () => {
    setChecking(true);
    setErrors([]);

    const result = await checkCartAvailability(items);

    if (!result.available) {
      setErrors(result.unavailableItems);
      onError(result.unavailableItems);
    } else {
      onProceed();
    }

    setChecking(false);
  };

  if (errors.length === 0) {
    return (
      <button
        onClick={handleCheckAvailability}
        disabled={checking}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {checking ? 'Verificando disponibilidad...' : 'Proceder al Checkout'}
      </button>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h4 className="font-bold text-red-900 mb-3">Problemas de disponibilidad:</h4>
      <ul className="space-y-2 mb-4">
        {errors.map((error) => (
          <li key={error.variantId} className="text-sm text-red-800">
            • {error.message}
          </li>
        ))}
      </ul>
      <button
        onClick={() => {
          setErrors([]);
          handleCheckAvailability();
        }}
        className="w-full px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
      >
        Reintentar
      </button>
    </div>
  );
}

// ============================================================================
// STOCK LEVEL INDICATOR - Visual progress bar
// ============================================================================

export function StockLevelIndicator({
  variantId,
  maxStock = 100,
}: {
  variantId: string;
  maxStock?: number;
}) {
  const [stock, setStock] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStock = async () => {
      const inventoryStatus = await getProductInventoryStatus(variantId);
      setStock(inventoryStatus.available);
      setLoading(false);
    };
    loadStock();
  }, [variantId]);

  if (loading) return <div className="h-2 bg-gray-200 rounded animate-pulse" />;
  if (stock === null) return null;

  const percentage = Math.min((stock / maxStock) * 100, 100);
  let color = 'bg-green-500';
  if (percentage < 33) color = 'bg-red-500';
  else if (percentage < 66) color = 'bg-yellow-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>Disponibilidad</span>
        <span>{stock} unidades</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// ============================================================================
// LOW STOCK WARNING - Alert for limited availability
// ============================================================================

export function LowStockWarning({
  variantId,
  threshold = 10,
}: {
  variantId: string;
  threshold?: number;
}) {
  const [show, setShow] = useState(false);
  const [stock, setStock] = useState<number | null>(null);

  useEffect(() => {
    const loadStock = async () => {
      const inventoryStatus = await getProductInventoryStatus(variantId);
      if (inventoryStatus.available > 0 && inventoryStatus.available <= threshold) {
        setStock(inventoryStatus.available);
        setShow(true);
      }
    };
    loadStock();
  }, [variantId, threshold]);

  if (!show || stock === null) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-center gap-3">
      <span className="text-xl">⚠️</span>
      <div className="text-sm">
        <p className="font-medium text-yellow-900">Disponibilidad limitada</p>
        <p className="text-yellow-800">Solo quedan {stock} unidades en stock</p>
      </div>
    </div>
  );
}

// ============================================================================
// STORE AVAILABILITY LIST - Show which stores have stock
// ============================================================================

export function StoreAvailabilityList({
  variantId,
}: {
  variantId: string;
}) {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStores = async () => {
      const availableStores = await getStoresWithAvailableInventory(variantId);
      setStores(availableStores);
      setLoading(false);
    };
    loadStores();
  }, [variantId]);

  if (loading) return <div className="text-gray-500 text-sm">Cargando disponibilidad...</div>;
  if (stores.length === 0) return null;

  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-bold text-gray-900 mb-3">Disponible en tiendas:</h4>
      <div className="space-y-3">
        {stores.map((store) => (
          <div key={store.storeId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div>
              <div className="font-medium text-gray-900">{store.storeName}</div>
              {store.address && <div className="text-xs text-gray-600">{store.address}</div>}
            </div>
            <div className="text-right">
              <div className="font-bold text-green-600">{store.available}</div>
              <div className="text-xs text-gray-600">en stock</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
