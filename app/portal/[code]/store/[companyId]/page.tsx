'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  LogOut, 
  Loader2, 
  Store, 
  ShoppingCart, 
  Rocket, 
  ArrowLeft, 
  Plus, 
  Minus, 
  CheckCircle2,
  Barcode,
  PackageSearch
} from 'lucide-react';
import Link from 'next/link';

export default function StoreProductsPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  const companyId = params?.companyId as string;
  
  const [company, setCompany] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!companyId) return;
      try {
        // 1. Toptancı Bilgilerini Çek
        const { data: comp } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();
        if (comp) setCompany(comp);

        // 2. Bu Toptancıya Ait Ürünleri Çek
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .eq('company_id', companyId)
          .order('name', { ascending: true });
        if (prods) setProducts(prods);

      } catch (error) {
        console.error("Mağaza verisi çekilemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [companyId, supabase]);

  // Sepet Güncelleme Fonksiyonu
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

  // Siparişi Toptancıya Gönder
  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    setSending(true);
    try {
      const { error } = await supabase.from('orders').insert({
        company_id: companyId,
        customer_cari_code: code,
        items: JSON.stringify(cart),
        total_amount: calculateTotal(),
        status: 'Beklemede' // Toptancı panelinde 'Beklemede' olarak görünecek
      });

      if (error) throw error;
      
      alert(`Siparişiniz ${company?.name} işletmesine başarıyla iletildi!`);
      router.push(`/portal/${code}/orders`);
    } catch (error: any) {
      alert("Sipariş gönderilirken hata oluştu: " + error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F4F7FE] gap-4">
      <Loader2 className="animate-spin text-[#3063E9]" size={48} />
      <p className="text-[#1B2559] font-bold uppercase tracking-widest text-xs">Ürünler Hazırlanıyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex font-sans">
      
      {/* SOL MENÜ (Sidebar - Tasarım Bütünlüğü İçin) */}
      <aside className="w-72 bg-[#1B2559] text-white p-8 flex-col justify-between hidden lg:flex fixed h-full shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Rocket className="text-white" size={22} />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic text-white">Durmaz<span className="text-blue-500">SaaS</span></span>
          </div>
          
          <nav className="space-y-3">
            <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
              <LayoutDashboard size={22} className="group-hover:text-white"/> Özet Panel
            </Link>
            
            <div className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9] text-white rounded-2xl font-bold transition-all shadow-lg">
               <Store size={22} /> Sipariş Ver
            </div>

            <Link href={`/portal/${code}/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
              <ShoppingBag size={22} className="group-hover:text-white"/> Sipariş & Mutabakat
            </Link>

            <Link href={`/portal/${code}/pos`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
              <Barcode size={22} className="group-hover:text-white"/> Hızlı Satış (POS)
            </Link>
          </nav>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/portal'))} className="flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold transition-all mt-auto border border-red-500/20">
          <LogOut size={22}/> Güvenli Çıkış
        </button>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 lg:ml-72 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* ÜST BAR */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-white">
             <div>
                <Link href={`/portal/${code}/stores`} className="flex items-center gap-2 text-blue-500 font-bold hover:gap-3 transition-all uppercase text-[10px] tracking-widest mb-3">
                  <ArrowLeft size={16} /> Toptancı Listesine Dön
                </Link>
                <h1 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter leading-none">{company?.name}</h1>
                <p className="text-gray-400 font-bold text-[10px] uppercase mt-2 tracking-widest">Hızlı Sipariş Ekranı</p>
             </div>
             <div className="bg-blue-50 px-6 py-4 rounded-3xl flex items-center gap-4 border border-blue-100">
                <PackageSearch className="text-blue-600" size={24} />
                <div>
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Aktif Ürün Sayısı</p>
                   <p className="text-xl font-black text-[#1B2559]">{products.length} Çeşit</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ÜRÜN LİSTESİ (8 Kolon) */}
            <div className="lg:col-span-8 space-y-4">
               {products.length === 0 ? (
                 <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-100 shadow-sm">
                    <ShoppingBag size={64} className="mx-auto text-gray-100 mb-6" />
                    <h3 className="text-xl font-black text-[#1B2559] uppercase">Ürün Bulunamadı</h3>
                    <p className="text-gray-400 font-bold mt-2 text-sm">Bu toptancının henüz sisteme kayıtlı ürünü yok.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {products.map(product => {
                      const cartItem = cart.find(i => i.id === product.id);
                      return (
                        <div key={product.id} className="bg-white p-6 rounded-[35px] shadow-sm border border-white hover:shadow-xl transition-all group relative overflow-hidden">
                           <div className="flex justify-between items-start mb-4">
                              <div className="w-12 h-12 bg-gray-50 text-[#1B2559] rounded-2xl flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                                 {product.name.substring(0,2).toUpperCase()}
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Birim Fiyat</p>
                                 <p className="text-xl font-black text-[#1B2559] mt-1">{Number(product.price).toLocaleString('tr-TR')} ₺</p>
                              </div>
                           </div>
                           
                           <h4 className="font-black text-[#1B2559] uppercase text-sm mb-6 h-10 line-clamp-2">{product.name}</h4>
                           
                           <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl border border-gray-100">
                              <button 
                                onClick={() => updateQuantity(product, -1)} 
                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm active:scale-95"
                              >
                                <Minus size={18}/>
                              </button>
                              <span className="font-black text-lg text-[#1B2559] w-10 text-center">{cartItem?.quantity || 0}</span>
                              <button 
                                onClick={() => updateQuantity(product, 1)} 
                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                              >
                                <Plus size={18}/>
                              </button>
                           </div>
                        </div>
                      )
                   })}
                 </div>
               )}
            </div>

            {/* SEPET PANELİ (4 Kolon) */}
            <div className="lg:col-span-4 sticky top-8">
               <div className="bg-[#1B2559] text-white p-8 rounded-[45px] shadow-2xl border border-white/10 relative overflow-hidden">
                  {/* Dekoratif Arka Plan */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                  
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                    <ShoppingCart className="text-blue-400" /> Güncel Sepetiniz
                  </h3>
                  
                  <div className="space-y-4 mb-10 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                     {cart.map(item => (
                       <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-[20px] border border-white/10 group">
                          <div>
                             <p className="text-[11px] font-black uppercase truncate w-32">{item.name}</p>
                             <p className="text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-widest">{item.quantity} x {item.price} ₺</p>
                          </div>
                          <p className="font-black text-sm">{(item.quantity * item.price).toLocaleString('tr-TR')} ₺</p>
                       </div>
                     ))}
                     
                     {cart.length === 0 && (
                       <div className="text-center py-12">
                          <ShoppingCart size={40} className="mx-auto mb-4 opacity-10" />
                          <p className="text-blue-200/30 text-[10px] font-black uppercase tracking-[0.3em]">Sepetiniz Boş</p>
                       </div>
                     )}
                  </div>

                  <div className="border-t border-white/10 pt-8 mb-8">
                     <div className="flex justify-between items-end">
                        <div>
                           <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] mb-1">Genel Toplam</p>
                           <p className="text-4xl font-black tracking-tighter">{calculateTotal().toLocaleString('tr-TR')} <span className="text-lg text-blue-400">₺</span></p>
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={handleSendOrder}
                    disabled={cart.length === 0 || sending}
                    className="w-full py-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-[25px] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    {sending ? <Loader2 className="animate-spin" size={24}/> : <><CheckCircle2 size={24} /> Siparişi İlet</>}
                  </button>
                  
                  <p className="text-[9px] text-blue-300/40 text-center mt-6 font-bold uppercase tracking-widest">Siparişiniz direkt toptancı paneline düşecektir.</p>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}