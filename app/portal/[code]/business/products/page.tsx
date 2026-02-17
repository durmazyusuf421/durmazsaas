'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, Menu, X, Search, Plus, Edit, Trash2, 
  Tag, Box, CheckCircle2, FileText, TrendingDown, Settings
} from 'lucide-react';
import Link from 'next/link';

export default function BusinessProductsPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [company, setCompany] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', unit: 'Adet' });

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchProducts = async () => {
    setLoading(true);
    let { data: compData } = await supabase.from('companies').select('*').eq('id', code).single();
    if (!compData) { const { data: nameData } = await supabase.from('companies').select('*').eq('name', code).single(); compData = nameData; }
    if (compData) {
        setCompany(compData);
        const { data: prods } = await supabase.from('products').select('*').eq('company_id', compData.id).order('name', { ascending: true });
        if (prods) setProducts(prods);
    }
    setLoading(false);
  };

  useEffect(() => { if (code) fetchProducts(); }, [code, supabase]);

  const openModal = (product: any = null) => {
      if (product) { setEditingProduct(product); setFormData({ name: product.name || '', price: product.price || '', stock: product.stock || '', unit: product.unit || 'Adet' }); }
      else { setEditingProduct(null); setFormData({ name: '', price: '', stock: '', unit: 'Adet' }); }
      setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!company) return;
      setIsSaving(true);
      try {
          const productData = { company_id: company.id, name: formData.name, price: Number(formData.price), stock: Number(formData.stock), unit: formData.unit };
          if (editingProduct) await supabase.from('products').update(productData).eq('id', editingProduct.id);
          else await supabase.from('products').insert([productData]);
          setIsModalOpen(false); fetchProducts();
      } catch (err: any) { alert("Hata: " + err.message); } finally { setIsSaving(false); }
  };

  const handleDeleteProduct = async (id: string) => {
      if (!confirm("Ürünü silmek üzeresiniz. Onaylıyor musunuz?")) return;
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
  };

  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#3063E9]" size={50} /></div>;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex font-sans selection:bg-[#3063E9]/30 overflow-x-hidden">
      <aside className="fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] hidden lg:flex shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(48,99,233,0.3)]"><Rocket size={26} className="text-white" /></div>
            <div><span className="text-2xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-[#3063E9]">SaaS</span></span><p className="text-[8px] font-black text-[#BC13FE] uppercase tracking-[0.3em]">Business Intelligence</p></div>
        </div>
        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}/business`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><LayoutDashboard size={20} className="group-hover:text-[#3063E9]"/> Komuta Merkezi</Link>
          <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#3063E9]/20 to-transparent border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold shadow-[0_0_30px_rgba(48,99,233,0.1)]"><Package size={20} className="text-[#3063E9]" /> Ürün Yönetimi</div>
          <Link href={`/portal/${code}/business/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><ShoppingCart size={20} className="group-hover:text-[#3063E9]" /> Gelen Siparişler</Link>
          <Link href={`/portal/${code}/business/invoices`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><FileText size={20} className="group-hover:text-[#3063E9]" /> Fatura Yönetimi</Link>
          <Link href={`/portal/${code}/business/customers`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Users size={20} className="group-hover:text-[#3063E9]" /> Bayi Ağı</Link>
          <Link href={`/portal/${code}/business/expenses`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><TrendingDown size={20} className="group-hover:text-red-500 transition-colors" /> Gider Takibi</Link>
          
          {/* SİSTEM AYARLARI EKLENDİ */}
          <Link href={`/portal/${code}/business/settings`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group mt-4"><Settings size={20} className="group-hover:text-gray-400 transition-colors" /> Sistem Ayarları</Link>
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/portal'))} className="flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all mt-auto group"><LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Güvenli Çıkış</button>
      </aside>

      <main className="flex-1 lg:ml-72 p-4 md:p-10">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12 bg-[#0F1219] p-8 rounded-[40px] border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#0B0E14] rounded-2xl border border-[#3063E9]/20"><Package className="text-[#3063E9]" size={32} /></div>
            <div><h2 className="text-3xl font-black tracking-tight uppercase italic">Ürün Kataloğu</h2><p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">İşletme: <span className="text-[#BC13FE]">{company?.name || '...'}</span></p></div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="w-full sm:w-80 relative group"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#3063E9] transition-colors" size={20} /><input type="text" placeholder="KATALOGDA ARA..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0B0E14] border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-xs font-bold focus:border-[#3063E9]/50 transition-all outline-none placeholder:text-gray-700" /></div>
            <button onClick={() => openModal()} className="w-full sm:w-auto px-8 py-4 bg-[#3063E9] text-white text-xs font-black rounded-2xl uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(48,99,233,0.3)] hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3"><Plus size={20} /> Yeni Ürün</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
            {filteredProducts.map((p) => (
                <div key={p.id} className="bg-[#0F1219] p-8 rounded-[35px] border border-white/5 hover:border-[#3063E9]/30 transition-all group flex flex-col relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-100 transition-opacity"><Package size={50} className="text-[#3063E9]" /></div>
                    <div className="flex justify-between items-start mb-8 relative z-10"><div className="w-14 h-14 bg-[#0B0E14] border border-white/5 text-[#3063E9] rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">{(p.name || 'ÜR').slice(0,2).toUpperCase()}</div><div className="text-right"><p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Birim Fiyat</p><p className="text-2xl font-black text-white">{Number(p.price).toLocaleString('tr-TR')} <span className="text-[#3063E9] text-base">₺</span></p></div></div>
                    <h4 className="font-black uppercase text-base mb-6 text-gray-300 group-hover:text-white line-clamp-2 min-h-[3rem] transition-colors">{p.name}</h4>
                    <div className="space-y-3 mb-8"><div className="flex items-center gap-3 text-[11px] font-bold text-gray-500 bg-[#0B0E14] px-4 py-3 rounded-xl border border-white/5"><Box size={16} className="text-[#BC13FE]" /> Stok: {p.stock} {p.unit}</div></div>
                    <div className="grid grid-cols-2 gap-4 mt-auto relative z-10">
                        <button onClick={() => openModal(p)} className="py-3 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"><Edit size={14}/> Düzenle</button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2"><Trash2 size={14}/></button>
                    </div>
                </div>
            ))}
        </div>
      </main>

      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <div className="bg-[#0F1219] w-full max-w-lg rounded-[45px] border border-[#3063E9]/30 shadow-[0_0_100px_rgba(48,99,233,0.2)] overflow-hidden">
                  <div className="bg-gradient-to-r from-[#3063E9]/20 to-transparent p-8 flex justify-between items-center border-b border-white/5"><h2 className="text-lg font-black uppercase tracking-[0.2em] text-white flex items-center gap-4"><Tag className="text-[#3063E9]" /> Ürün Protokolü</h2><button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white p-2.5 bg-white/5 rounded-full transition-all"><X size={24}/></button></div>
                  <form onSubmit={handleSaveProduct} className="p-10 space-y-8 bg-[#0B0E14]">
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Stok Kartı İsmi</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-[#3063E9] outline-none transition-all uppercase placeholder:text-gray-800 text-white" placeholder="ÖRN: SÜZME YOĞURT 5KG" /></div>
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Fiyat (₺)</label><input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-[#3063E9] outline-none text-white" placeholder="0.00" /></div>
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Stok Miktarı</label><input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-[#3063E9] outline-none text-white" placeholder="0" /></div>
                      </div>
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Birim Tipi</label><select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-[#3063E9] outline-none text-white appearance-none"><option value="Adet">ADET</option><option value="Kg">KİLOGRAM (KG)</option><option value="Koli">KOLİ</option><option value="Litre">LİTRE</option></select></div>
                      <button type="submit" disabled={isSaving} className="w-full py-6 bg-[#3063E9] text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-[0_10px_40px_rgba(48,99,233,0.4)] hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-4">{isSaving ? <Loader2 size={22} className="animate-spin" /> : <CheckCircle2 size={22} />} Sistemi Güncelle</button>
                  </form>
              </div>
          </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #3063E933; border-radius: 10px; }`}} />
    </div>
  );
}