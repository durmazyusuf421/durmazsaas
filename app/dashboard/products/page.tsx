'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Package, Plus, Loader2, Edit, Trash2, X } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [editProduct, setEditCustomer] = useState({ id: '', name: '', price: '' }); // setEditProduct yerine isim karışıklığını önlemek için

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) return;

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (data) setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // 🟢 YENİ ÜRÜN EKLE
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return alert("Ürün adı ve fiyatı zorunludur!");
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single();

      const { error } = await supabase.from('products').insert([{
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        company_id: profile?.company_id
      }]);

      if (!error) {
        setIsModalOpen(false);
        setNewProduct({ name: '', price: '' });
        fetchProducts();
      } else {
        alert("Hata: " + error.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  // 🟠 ÜRÜN GÜNCELLE
  const handleUpdateProduct = async () => {
    if (!editProduct.name || !editProduct.price) return alert("Boş alan bırakılamaz!");
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ name: editProduct.name, price: parseFloat(editProduct.price) })
        .eq('id', editProduct.id);

      if (!error) {
        setIsEditModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // 🔴 ÜRÜN SİL
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-[#1B2559]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Ürünler & Katalog</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">Dükkanda satılan malları ve fiyatlarını yönetin.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all">
          <Plus size={20} /> Ürün Ekle
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[30px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-50">
              <tr>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Ürün / Hizmet Adı</th>
                <th className="p-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Birim Fiyatı</th>
                <th className="p-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={32}/></td></tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-20 text-center">
                    <Package size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-medium">Henüz raflara ürün eklemediniz.</p>
                  </td>
                </tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-5 font-bold text-[#1B2559] flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Package size={20} />
                    </div>
                    {p.name}
                  </td>
                  <td className="p-5 text-right">
                    <span className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-black tracking-tight border border-green-100">
                      ₺{Number(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditCustomer({ id: p.id, name: p.name, price: p.price.toString() });
                          setIsEditModalOpen(true);
                        }}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Düzenle"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🟢 YENİ ÜRÜN MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#1B2559]">Yeni Ürün Ekle</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Örn: 50 Kg Un" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-500 font-medium" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₺</span>
                <input type="number" placeholder="0.00" className="w-full p-4 pl-8 bg-gray-50 rounded-2xl outline-none focus:border-blue-500 font-medium" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 p-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl">Vazgeç</button>
                <button onClick={handleAddProduct} disabled={processing} className="flex-1 p-4 bg-[#3063E9] text-white rounded-2xl font-bold shadow-lg shadow-blue-200 flex justify-center items-center">
                  {processing ? <Loader2 className="animate-spin" size={20} /> : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟠 ÜRÜN DÜZENLEME MODALI */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#1B2559]">Ürünü Düzenle</h2>
              <button onClick={() => setIsEditModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Ürün Adı" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-500 font-medium" value={editProduct.name} onChange={e => setEditCustomer({...editProduct, name: e.target.value})} />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₺</span>
                <input type="number" placeholder="0.00" className="w-full p-4 pl-8 bg-gray-50 rounded-2xl outline-none focus:border-blue-500 font-medium" value={editProduct.price} onChange={e => setEditCustomer({...editProduct, price: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 p-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl">Vazgeç</button>
                <button onClick={handleUpdateProduct} disabled={processing} className="flex-1 p-4 bg-[#3063E9] text-white rounded-2xl font-bold shadow-lg shadow-blue-200 flex justify-center items-center">
                  {processing ? <Loader2 className="animate-spin" size={20} /> : "Güncelle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}