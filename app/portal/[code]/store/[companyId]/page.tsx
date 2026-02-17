'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, LogOut, Loader2, Store, 
  ShoppingCart, Rocket, ArrowLeft, Plus, Minus, CheckCircle2,
  Barcode, PackageSearch, Menu, X
} from 'lucide-react';
import Link from 'next/link';

export default function NeonStoreProductsPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  const companyId = params?.companyId as string;
  
  const [company, setCompany] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!companyId) return;
      try {
        const { data: comp } = await supabase.from('companies').select('name').eq('id', companyId).single();
        if (comp) setCompany(comp);

        const { data: prods } = await supabase.from('products').select('*').eq('company_id', companyId).order('name', { ascending: true });
        if (prods) setProducts(prods);
      } catch (error) {
        console.error("Mağaza verisi çekilemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [companyId, supabase]);

  const updateQuantity = (product: any, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(item => item.id !== product.id);
        return prev.map(item => item.id === product.id ? { ...item, quantity: newQty } : item);
      }
      if (delta > 0) return [...prev, { ...product, quantity: 1 }];
      return prev;
    });
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    setSending(true);
    try {
      const { error } = await supabase.from('orders').insert({
        company_id: companyId,
        customer_cari_code: code,
        items: JSON.stringify(cart),
        total_amount: calculateTotal(),
        status: 'Beklemede'
      });
      if (error) throw error;
      
      alert(`Siparişiniz ${company?.name} işletmesine neon hızıyla iletildi!`);
      router.push(`/portal/${code}/orders`);
    } catch (error: any) {
      alert("Hata: " + error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#BC13FE]" size={48} />
      <p className="text-white/50 font-bold uppercase tracking-widest text-xs mt-4">Ürünler Yükleniyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#BC13FE]/30 overflow-x-hidden">
      
      {/* --- SIDEBAR (RESPONSIVE) --- */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(188,19,254,0.3)]"><Rocket size={22} /></div>
            <span className="text-xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-[#BC13FE]">SaaS</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500"><X /></button>
        </div>
        
        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all">
            <LayoutDashboard size={20} className="group-hover:text-[#BC13FE]"/> Ana Sayfa
          </Link>
          <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#BC13FE]/20 to-transparent border-l-4 border-[#BC13FE] text-white rounded-r-xl font-bold transition-all shadow-lg">
             <Store size={20} className="text-[#BC13FE]" /> Sipariş Ver
          </div>
          <Link href={`/portal/${code}/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <ShoppingBag size={20} className="group-hover:text-[#BC13FE]" /> Sipariş & Mutabakat
          </Link>
          <Link href={`/portal/${code}/pos`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
            <Barcode size={20} className="group-hover:text-[#BC13FE]" /> Hızlı Satış (POS)
          </Link>
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/portal'))} className="flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all"><LogOut size={20}/> Çıkış Yap</button>
      </aside>

      {/* --- ANA İÇERİK --- */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''} lg:ml-72 p-4 md:p-8 lg:p-10`}>
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 bg-[#0F1219] p-6 md:p-8 rounded-[30px] border border-white/5">
           <div>
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/5"><Menu size={18} /></button>
                <Link href={`/portal/${code}/stores`} className="flex items-center gap-2 text-[#BC13FE] hover:text-[#BC13FE]/80 font-bold uppercase text-[10px] tracking-[0.2em] transition-all">
                  <ArrowLeft size={16} /> Toptancı Listesine Dön
                </Link>
              </div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">{company?.name}</h1>
              <p className="text-gray-500 font-bold text-[10px] uppercase mt-2 tracking-widest">Hızlı Dijital Sipariş Ekranı</p>
           </div>
           
           <div className="w-full md:w-auto bg-[#0B0E14] px-6 py-4 rounded-2xl flex items-center gap-4 border border-white/5 shadow-inner">
              <PackageSearch className="text-[#BC13FE]" size={24} />
              <div>
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sistemdeki Ürünler</p>
                 <p className="text-lg font-black text-white">{products.length} Çeşit</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ÜRÜN LİSTESİ (8 Kolon) */}
          <div className="lg:col-span-8 space-y-4">
             {products.length === 0 ? (
               <div className="bg-[#0F1219] p-20 rounded-[40px] text-center border-2 border-dashed border-white/5">
                  <ShoppingBag size={64} className="mx-auto text-gray-700 mb-6" />
                  <h3 className="text-xl font-black uppercase tracking-widest">Ürün Bulunamadı</h3>
                  <p className="text-gray-500 font-bold mt-2 text-xs">Tedarikçi henüz vitrinini güncellemedi.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {products.map(product => {
                    const cartItem = cart.find(i => i.id === product.id);
                    return (
                      <div key={product.id} className="bg-[#0F1219] p-6 rounded-[30px] border border-white/5 hover:border-[#BC13FE]/50 transition-all group relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-[#BC13FE]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         
                         <div className="relative z-10">
                           <div className="flex justify-between items-start mb-6">
                              <div className="w-12 h-12 bg-[#0B0E14] border border-white/5 text-[#BC13FE] rounded-2xl flex items-center justify-center font-black group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(188,19,254,0.1)]">
                                 {product.name.substring(0,2).toUpperCase()}
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Birim Fiyat</p>
                                 <p className="text-xl font-black text-white">{Number(product.price).toLocaleString('tr-TR')} ₺</p>
                              </div>
                           </div>
                           
                           <h4 className="font-black uppercase text-sm mb-6 h-10 line-clamp-2 text-gray-300 group-hover:text-white transition-colors">{product.name}</h4>
                           
                           <div className="flex items-center justify-between bg-[#0B0E14] p-2 rounded-2xl border border-white/5">
                              <button onClick={() => updateQuantity(product, -1)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95">
                                <Minus size={18}/>
                              </button>
                              <span className="font-black text-lg w-10 text-center">{cartItem?.quantity || 0}</span>
                              <button onClick={() => updateQuantity(product, 1)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#BC13FE] hover:bg-[#BC13FE] hover:text-white transition-all shadow-sm active:scale-95">
                                <Plus size={18}/>
                              </button>
                           </div>
                         </div>
                      </div>
                    )
                 })}
               </div>
             )}
          </div>

          {/* SEPET PANELİ (4 Kolon - STICKY) */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 mt-8 lg:mt-0">
             <div className="bg-[#0F1219] p-6 md:p-8 rounded-[35px] border border-white/5 relative overflow-hidden shadow-[0_0_40px_rgba(188,19,254,0.05)]">
                {/* Dekoratif Arka Plan Glow */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#BC13FE]/10 rounded-full blur-[80px]"></div>
                
                <h3 className="text-lg font-black uppercase tracking-tighter mb-8 flex items-center gap-3 relative z-10">
                  <ShoppingCart className="text-[#BC13FE]" /> Ağ Sepeti
                </h3>
                
                <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                   {cart.map(item => (
                     <div key={item.id} className="flex justify-between items-center bg-[#0B0E14] p-4 rounded-2xl border border-white/5">
                        <div>
                           <p className="text-[10px] font-black uppercase text-gray-300 truncate w-32 md:w-40">{item.name}</p>
                           <p className="text-[9px] text-[#BC13FE] font-bold mt-1 uppercase tracking-widest">{item.quantity} ADET x {item.price} ₺</p>
                        </div>
                        <p className="font-black text-sm text-white">{(item.quantity * item.price).toLocaleString('tr-TR')} ₺</p>
                     </div>
                   ))}
                   
                   {cart.length === 0 && (
                     <div className="text-center py-10">
                        <ShoppingCart size={32} className="mx-auto mb-4 opacity-20 text-gray-500" />
                        <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em]">Aktarılan Veri Yok</p>
                     </div>
                   )}
                </div>

                <div className="border-t border-white/10 pt-6 mb-8 relative z-10">
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Ağ Toplamı</p>
                         <p className="text-3xl font-black tracking-tighter text-white">{calculateTotal().toLocaleString('tr-TR')} <span className="text-lg text-[#BC13FE]">₺</span></p>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={handleSendOrder}
                  disabled={cart.length === 0 || sending}
                  className="relative z-10 w-full py-5 bg-gradient-to-r from-[#3063E9] to-[#BC13FE] hover:opacity-90 disabled:opacity-50 text-white rounded-[20px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(188,19,254,0.3)] transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {sending ? <Loader2 className="animate-spin" size={20}/> : <><CheckCircle2 size={20} /> Protokolü Başlat</>}
                </button>
                
                <p className="text-[8px] text-gray-600 text-center mt-6 font-bold uppercase tracking-widest relative z-10">Veriler güvenli ağ üzerinden toptancıya iletilir.</p>
             </div>
          </div>

        </div>
      </main>

      {/* GÜVENLİ CSS ENJEKSİYONU */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #BC13FE33; border-radius: 10px; }
      `}} />
    </div>
  );
}