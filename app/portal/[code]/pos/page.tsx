'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Store, ShoppingBag, Rocket, LogOut, 
  Lock, CheckCircle2, Barcode, Scale, Zap, ShieldCheck, 
  ArrowRight, Sparkles, Loader2 
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function RetailerPOSPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  // Şimdilik test için false yapıyoruz. Onaylayınca veritabanına bağlarız.
  const [isPremium, setIsPremium] = useState(false); 
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Burada ileride profiles tablosundan is_premium bilgisini çekeceğiz
    setTimeout(() => setLoading(false), 800);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/portal');
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F4F7FE] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="text-[#1B2559] font-bold uppercase tracking-widest text-xs text-center">Modül Hazırlanıyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex font-sans overflow-hidden">
      
      {/* SOL MENÜ (Sidebar - Tasarım Değişmez) */}
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
            
            <Link href={`/portal/${code}/stores`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
               <Store size={22} className="group-hover:text-white" /> Sipariş Ver
            </Link>

            <Link href={`/portal/${code}/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-2xl font-bold transition-all group">
              <ShoppingBag size={22} className="group-hover:text-white"/> Sipariş & Mutabakat
            </Link>

            {/* POS MENÜSÜ (Şu an buradayız) */}
            <div className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9] text-white rounded-2xl font-bold transition-all shadow-lg">
               <Barcode size={22} /> Hızlı Satış (POS)
            </div>
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold transition-all mt-auto border border-red-500/20">
          <LogOut size={22}/> Güvenli Çıkış
        </button>
      </aside>

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1 lg:ml-72 p-6 md:p-12 h-screen overflow-y-auto">
        
        {!isPremium ? (
          /* --- PREMIUM KİLİT EKRANI (PAYWALL) --- */
          <div className="max-w-4xl mx-auto py-10">
            <div className="bg-white rounded-[50px] shadow-2xl overflow-hidden border border-white relative">
              
              {/* Arka Plan Süsü */}
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Sparkles size={300} />
              </div>

              {/* Üst Kısım */}
              <div className="bg-gradient-to-r from-[#1B2559] to-[#3063E9] p-12 text-center text-white">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/20">
                  <Lock size={40} className="text-white" />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">DURMAZ POS PREMIUM</h2>
                <p className="text-blue-100 font-bold max-w-lg mx-auto leading-relaxed uppercase text-sm tracking-widest">
                  Toptancınızdan gelen ürünleri anında satın! Manuel veri girişini bitiren, barkodlu ve terazili satış sistemi.
                </p>
              </div>

              {/* Özellikler Grid */}
              <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50">
                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-blue-50">
                    <Zap size={24}/>
                  </div>
                  <div>
                    <h4 className="font-black text-[#1B2559] uppercase text-sm mb-1">Otomatik Stok Girişi</h4>
                    <p className="text-xs text-gray-500 font-medium">Toptancı faturayı onayladığı an raflarınız dijitalde otomatik dolar.</p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm shrink-0 border border-orange-50">
                    <Scale size={24}/>
                  </div>
                  <div>
                    <h4 className="font-black text-[#1B2559] uppercase text-sm mb-1">Hassas Terazi & Dara</h4>
                    <p className="text-xs text-gray-500 font-medium">Gramajlı ürünleri dara düşerek saniyeler içinde tartın ve satın.</p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm shrink-0 border border-green-50">
                    <ShieldCheck size={24}/>
                  </div>
                  <div>
                    <h4 className="font-black text-[#1B2559] uppercase text-sm mb-1">Cari Takip & Veresiye</h4>
                    <p className="text-xs text-gray-500 font-medium">Müşterilerinizin borçlarını tek tıkla deftere değil, sisteme yazın.</p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-sm shrink-0 border border-purple-50">
                    <Barcode size={24}/>
                  </div>
                  <div>
                    <h4 className="font-black text-[#1B2559] uppercase text-sm mb-1">Sınırsız Barkodlu Satış</h4>
                    <p className="text-xs text-gray-500 font-medium">Lazer okuyucuyla market hızında satış yapın, kuyrukları bitirin.</p>
                  </div>
                </div>
              </div>

              {/* Satın Alma Butonu */}
              <div className="p-12 bg-white text-center border-t border-gray-100">
                <div className="mb-8">
                  <span className="text-5xl font-black text-[#1B2559]">299 ₺</span>
                  <span className="text-gray-400 font-bold uppercase text-sm ml-2">/ Aylık</span>
                </div>
                <button className="px-12 py-5 bg-[#3063E9] text-white font-black rounded-3xl uppercase tracking-widest shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all flex items-center justify-center gap-3 mx-auto">
                  Premium'a Yükselt <ArrowRight size={20}/>
                </button>
                <p className="text-[10px] font-bold text-gray-400 mt-6 uppercase tracking-[0.2em]">7 Gün Ücretsiz Deneme İmkanı</p>
              </div>

            </div>
          </div>
        ) : (
          /* --- ASIL POS EKRANI (Premium Aktifse) --- */
          <div className="h-full flex flex-col">
            {/* Burada bir önceki adımda yazdığımız o devasa POS ekranı olacak */}
            <h1 className="text-2xl font-black text-[#1B2559]">DURMAZ POS AKTİF 🚀</h1>
          </div>
        )}
        
      </main>
    </div>
  );
}