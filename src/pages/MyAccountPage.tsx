import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { ShoppingBag, User, Package, ChevronRight, Save, LogOut } from 'lucide-react';
import { getCustomerOrders, getCustomerProfile, updateCustomerProfile, syncCustomerWithSupabase } from '../lib/customer-api';
import type { Order, Customer } from '../types/database';
import { Toast } from '../components/Toast';

export function MyAccountPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const [profile, setProfile] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    rnc: '',
    razon_social: '',
    shipping_address: '',
    billing_address: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const customer = await syncCustomerWithSupabase(user);
      if (customer) {
        setProfile(customer);
        setFormData({
          name: customer.name || '',
          phone: customer.phone || '',
          rnc: (customer as any).rnc || '',
          razon_social: (customer as any).razon_social || '',
          shipping_address: typeof customer.shipping_address === 'string' ? customer.shipping_address : JSON.stringify(customer.shipping_address || ''),
          billing_address: typeof customer.billing_address === 'string' ? customer.billing_address : JSON.stringify(customer.billing_address || '')
        });
        
        const orderHistory = await getCustomerOrders(customer.email);
        setOrders(orderHistory);
      }
    } catch (err) {
      console.error('Error loading account data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);
    
    // Preparar datos para Supabase
    const updates = {
      ...formData,
      shipping_address: formData.shipping_address,
      billing_address: formData.billing_address
    };

    const success = await updateCustomerProfile(profile.id, updates as any);
    if (success) {
      setToast('¡Perfil actualizado! ✓');
      setTimeout(() => setToast(null), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="account-container min-h-screen bg-[#fafafa] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-black to-gray-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Mi Cuenta</h1>
              <p className="text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors self-start md:self-center"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section: Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6 text-gray-900 font-semibold">
                <User size={20} className="text-gray-400" />
                Información de Perfil
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Teléfono</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">RNC / Cédula</label>
                  <input 
                    type="text" 
                    value={formData.rnc}
                    onChange={e => setFormData({...formData, rnc: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Razón Social</label>
                  <input 
                    type="text" 
                    value={formData.razon_social}
                    onChange={e => setFormData({...formData, razon_social: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Dirección de Envío</label>
                  <textarea 
                    value={formData.shipping_address}
                    onChange={e => setFormData({...formData, shipping_address: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Dirección de Facturación</label>
                  <textarea 
                    value={formData.billing_address}
                    onChange={e => setFormData({...formData, billing_address: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                  />
                </div>
                
                <button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all disabled:bg-gray-400"
                >
                  {saving ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
                </button>
              </div>
            </div>
          </div>

          {/* Section: Orders History */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                  <Package size={20} className="text-gray-400" />
                  Historial de Pedidos
                </div>
                <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">
                  {orders.length} pedidos
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag size={24} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Aún no tienes pedidos</h3>
                  <p className="text-gray-500 max-w-xs mt-2">Explora nuestra tienda y haz tu primera compra para verla aquí.</p>
                  <a href="/" className="mt-8 text-black font-bold underline underline-offset-4">Ir a la tienda</a>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="group p-5 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all cursor-pointer">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-black font-bold">
                            #{order.id.split('-')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{new Date(order.created_at).toLocaleDateString()}</div>
                            <div className="text-sm text-gray-500">
                              {order.currency} {order.total?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end gap-6">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                            ${order.status === 'paid' || order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                          >
                            {order.status}
                          </span>
                          <ChevronRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Toast message={toast} />

      <style dangerouslySetInnerHTML={{ __html: `
        .account-container {
          font-family: 'Outfit', sans-serif;
        }
      `}} />
    </div>
  );
}
