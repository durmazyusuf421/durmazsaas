'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, LogOut, Loader2, Store, 
  Rocket, Barcode, Menu, X, Search, ChevronRight, Building2, MapPin
} from 'lucide-react';
import Link from 'next/link';

export default function NeonStoresPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStores = async () => {
      // Müşteriye bağlı işletmeleri (toptancıları) çek
      const { data: linked } = await supabase
        .from('customers')
        .select('company_id, companies(id, name)')
        .eq('current_cari_code', code);
      
      if (linked) {
        // companies verisini düzeltip state'e atıyoruz
        const formatted = linked.map((l: any) => l.companies);
        setBusinesses(formatted);
      }
      setLoading(false);
    };
    if (code) fetchStores();
  }, [code, supabase]);

  const filteredStores = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen bg-[#0B0E14] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#BC13FE]" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#BC13FE]/30 overflow-x-hidden">
      
      {/* --- SIDEBAR (RESPONSIVE - DASHBOARD İLE AYNI) --- */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(188,19,254,0.3)]"><Rocket size={22} /></div>
          <span className="text-xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-[#BC13FE]">SaaS</span></span>
        </div>
        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group">
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
      <main className="lg:ml-72 p-4 md:p-8 lg:p-10">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-[#0F1219] rounded-xl border border-white/5"><Menu size={20} /></button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Sipariş Ver</h2>
              <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase mt-1">Bağlı Olduğunuz Toptancı Listesi</p>
            </div>
          </div>
          
          {/* ARAMA BARI (NEON) */}
          <div className="w-full md:w-96 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#BC13FE] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="İŞLETME ARA..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0F1219] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-[#BC13FE]/50 transition-all placeholder:text-gray-700 uppercase"
            />
          </div>
        </div>

        {/* TOPTANCI GRID */}
        {filteredStores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0F1219] rounded-[40px] border border-white/5 border-dashed">
            <Building2 size={64} className="text-gray-800 mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Bağlı işletme bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <Link 
                key={store.id} 
                href={`/portal/${code}/store/${store.id}`}
                className="group relative bg-[#0F1219] p-8 rounded-[35px] border border-white/5 hover:border-[#BC13FE]/30 transition-all overflow-hidden"
              >
                {/* Neon Hover Efekti */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#BC13FE]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-[#0B0E14] border border-white/5 rounded-2xl flex items-center justify-center text-[#BC13FE] shadow-inner group-hover:scale-110 transition-transform">
                      <Building2 size={28} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-md mb-1 uppercase tracking-widest">Sistemde Aktif</span>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">ID: {store.id.slice(0, 8)}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-black uppercase tracking-tight mb-2 group-hover:text-[#BC13FE] transition-colors">{store.name}</h3>
                  
                  <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-8">
                    <MapPin size={12} className="text-[#BC13FE]/50" /> Bölgesel Tedarikçi
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Alışverişe Başla</span>
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-[#BC13FE] group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>

                {/* Arka plan süsü */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#BC13FE]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        )}

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #BC13FE33; border-radius: 10px; }
      `}</style>
    </div>
  );
}