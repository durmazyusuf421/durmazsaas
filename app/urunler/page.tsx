'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Plus, Package, Trash2, Search, X } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Verisi
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (!error) setProducts(data || []);
    setLoading(false);
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      
      const { error } = await supabase.from('products').insert([{
        company_id: profile?.company_id,
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      }]);

      if (error) throw error;

      setIsModalOpen(false);
      setFormData({ name: '', price: '', stock: '' });
      fetchProducts();
      alert("Ürün eklendi! 📦");

    } catch (error: any) {
      alert("Hata: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu ürünü silmek istediğine emin misin?")) return;
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      fetchProducts();
    } else {
      alert("Silinemedi: " + error.message);
    }
  }

  return (
    <div className="p-8 ml-64 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Ürünler & Stok</h1>
          <p className="text-slate-500 text-sm mt-1">Stok durumunu takip et, yeni ürünler ekle.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Plus size={20} /> Yeni Ürün Ekle
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Ürün Adı</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right">Fiyat</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-center">Stok</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Yükleniyor...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Deponuz boş görünüyor.</td></tr>
            ) : products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Package size={18} className="text-blue-500"/> {product.name}
                  </p>
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-slate-600">
                  {product.price.toLocaleString('tr-TR')} ₺
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    product.stock > 10 ? 'bg-emerald-100 text-emerald-700' : 
                    product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.stock} Adet
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Yeni Ürün Ekle</h2>
                <button onClick={() => setIsModalOpen(false)}><X/></button>
             </div>
             <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Ürün Adı</label>
                  <input required className="w-full p-3 border rounded-xl font-bold" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Örn: iPhone 13 Kılıf"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Satış Fiyatı (₺)</label>
                    <input type="number" required className="w-full p-3 border rounded-xl" 
                      value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Stok Adedi</label>
                    <input type="number" required className="w-full p-3 border rounded-xl" 
                      value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0"/>
                  </div>
                </div>
                <button disabled={submitting} type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg">
                  KAYDET
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}