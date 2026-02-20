'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, Menu, X, 
  Search, Plus, Edit, Trash2, MapPin, Phone, CheckCircle2, ShieldCheck, Zap
} from 'lucide-react';
import Link from 'next/link';

// --- TYPESCRIPT ARAYÜZLERİ ---
interface Customer {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  city?: string;
  balance: number;
  status: string;
}

export default function BusinessCustomers() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || '';
  
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);

  const [quickSearchCode, setQuickSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);

  const [newCust, setNewCust] = useState({ name: '', code: '', email: '', phone: '', city: '' });

  // --- TAZE VERİ ÇEKME FONKSİYONU ---
  const fetchNetworkData = async (compId: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', compId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCustomers(data as Customer[]);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        let myCompany = null;
        const { data: byCode } = await supabase.from('companies').select('*').eq('name', code).maybeSingle();
        if (byCode) {
            myCompany = byCode;
        } else {
            const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle();
            if (profile?.company_id) {
                const { data: byProfile } = await supabase.from('companies').select('*').eq('id', profile.company_id).maybeSingle();
                myCompany = byProfile;
            }
        }

        // Bypass: Hiçbiri yoksa ilk şirketi al
        if (!myCompany) {
            const { data: first } = await supabase.from('companies').select('*').limit(1).maybeSingle();
            myCompany = first;
        }

        if (myCompany) {
          setCompany(myCompany);
          await fetchNetworkData(myCompany.id);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    initPage();
  }, [code, router, supabase]);

  // --- 🚀 SORGULAMA MOTORU ---
  const handleQuickSearch = async () => {
    if (!quickSearchCode) return;
    setSearchLoading(true);
    setSearchResult(null);
    const cleanCode = quickSearchCode.trim().toUpperCase();

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, global_cari_code, city, phone')
        .ilike('global_cari_code', cleanCode)
        .maybeSingle();

      if (data && data.global_cari_code) {
        setSearchResult({
          name: data.full_name,
          code: data.global_cari_code,
          city: data.city || 'Sistem Kayıtlı',
          phone: data.phone || '-',
        });
      } else {
        setSearchResult('not_found');
      }
    } catch (e) { 
        setSearchResult('not_found'); 
    } finally { 
        setSearchLoading(false); 
    }
  };

  // --- 🏹 AĞA EKLEME BUTONU (SÜTUN HATALARI ONARILDI) ---
  const handleAddFromMaster = async () => {
    if (!searchResult || searchResult === 'not_found' || !company?.id) {
        return;
    }

    setAddLoading(true);
    try {
      const isExist = customers.some(c => (c.code || "").toUpperCase() === searchResult.code.toUpperCase());
      if (isExist) {
        alert("⚠️ Bu bayi zaten ağınızda mevcut.");
        setAddLoading(false);
        setIsQuickAddModalOpen(false);
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          company_id: company.id,
          name: searchResult.name,
          code: searchResult.code,
          city: searchResult.city || 'Bulut Kaydı',
          phone: searchResult.phone || '-',
          balance: 0,
          status: 'active' // SQL tarafında sütun eklendi!
        }])
        .select();

      if (error) {
          console.error("❌ Kayıt Hatası:", error);
          alert(`Siber Hata Raporu:\n\nMesaj: ${error.message}\nLütfen SQL Editor kısmındaki komutu çalıştırdığınızdan emin olun.`);
          setAddLoading(false);
          return;
      }

      if (data) {
        await fetchNetworkData(company.id);
        setIsQuickAddModalOpen(false);
        setSearchResult(null);
        setQuickSearchCode('');
        alert("✅ Bayi başarıyla ağınıza eklendi!");
      }
    } catch (e) { 
        console.error(e);
        alert("Sistemsel bir hata oluştu."); 
    } finally {
        setAddLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCust.name || !newCust.code || !company?.id) return;
    try {
      const { data, error } = await supabase.from('customers').insert([{ company_id: company.id, ...newCust, balance: 0, status: 'active' }]).select();
      if (!error && data) {
        await fetchNetworkData(company.id);
        setNewCust({ name: '', code: '', email: '', phone: '', city: '' });
        setIsAddModalOpen(false);
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="h-screen bg-[#0B0E14] flex items-center justify-center"><Loader2 className="animate-spin text-[#3063E9]" size={50} /></div>;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#3063E9]/30">
      
      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#3063E9] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20"><Rocket size={22} /></div>
          <span className="text-xl font-black italic uppercase leading-none">Durmaz<span className="text-[#3063E9]">SaaS</span></span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto text-gray-500"><X /></button>
        </div>
        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}/business`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><LayoutDashboard size={20}/> Komuta Merkezi</Link>
          <Link href={`/portal/${code}/business/orders`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><ShoppingCart size={20}/> Siparişler</Link>
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9]/10 border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold transition-all"><Users size={20} className="text-[#3063E9]" /> Bayi Ağı</button>
        </nav>
      </aside>

      <main className="lg:ml-72 p-6 md:p-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-white/5 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-[#0F1219] rounded-lg border border-white/5"><Menu size={20} /></button>
            <h2 className="text-3xl font-black uppercase italic">Bayi Ağı</h2>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => setIsQuickAddModalOpen(true)} className="flex-1 md:flex-none px-6 py-3 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all"><Zap size={16} className="text-yellow-500" /> Kod ile Sorgula</button>
            <button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none px-6 py-3 bg-[#3063E9] text-white rounded-2xl font-black text-[10px] shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all"><Plus size={18} /> Yeni Cari</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {customers.filter(c => (c.name || "").toLowerCase().includes(searchQuery.toLowerCase())).map((c) => (
            <div key={c.id} className="bg-[#0F1219] border border-white/5 p-6 rounded-[32px] space-y-4 hover:border-[#3063E9]/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#3063E9]/5 blur-3xl rounded-full" />
                <div className="flex justify-between items-start relative z-10">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-[#3063E9]/30 transition-all"><Users size={24} className="text-[#3063E9]" /></div>
                    <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase border border-green-500/20 text-green-500 bg-green-500/5">Aktif</span>
                </div>
                <div className="relative z-10"><h3 className="text-lg font-black uppercase text-white truncate">{c.name}</h3><p className="text-[10px] text-[#3063E9] font-bold tracking-widest">{c.code}</p></div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5 relative z-10">
                    <div><p className="text-[9px] text-gray-500 font-black uppercase">Bakiye</p><p className="text-xl font-black italic text-white">{c.balance.toLocaleString('tr-TR')} ₺</p></div>
                    <div className="flex gap-2"><button className="p-2 bg-white/5 rounded-lg hover:text-[#3063E9] transition-colors"><Edit size={14}/></button></div>
                </div>
            </div>
          ))}
          {customers.length === 0 && <div className="col-span-full py-20 text-center opacity-20 uppercase font-black tracking-widest">Ağınız boş görünüyor</div>}
        </div>
      </main>

      {/* SORGULAMA MODALI */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsQuickAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0F1219] border border-[#3063E9]/30 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0B0E14]">
                <h3 className="text-xl font-black italic uppercase leading-none">Siber Sorgu</h3>
                <button onClick={() => setIsQuickAddModalOpen(false)} className="p-2 bg-white/5 hover:bg-red-500 rounded-xl transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
                <div className="relative">
                    <input 
                      type="text" 
                      value={quickSearchCode} 
                      onChange={e => setQuickSearchCode(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleQuickSearch()}
                      placeholder="Cari Kodu Yazın" 
                      className="w-full bg-[#020408] border border-white/10 rounded-2xl p-5 text-sm font-bold outline-none focus:border-[#3063E9] text-center uppercase" 
                    />
                    <button onClick={handleQuickSearch} disabled={searchLoading} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#3063E9] rounded-xl hover:bg-blue-600 transition-all">
                        {searchLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                    </button>
                </div>

                {searchResult && searchResult !== 'not_found' && (
                    <div className="bg-[#3063E9]/5 border border-[#3063E9]/20 rounded-3xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#3063E9] rounded-xl flex items-center justify-center shadow-lg"><ShieldCheck size={24} /></div>
                            <div><h4 className="font-black uppercase text-sm mb-1">{searchResult.name}</h4><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{searchResult.code}</p></div>
                        </div>
                        <button onClick={handleAddFromMaster} disabled={addLoading} className="w-full py-5 bg-[#3063E9] text-white rounded-2xl font-black uppercase text-[10px] shadow-xl flex items-center justify-center gap-2 transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50">
                          {addLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                          Cariyi Ağıma Ekle
                        </button>
                    </div>
                )}
                {searchResult === 'not_found' && <div className="text-center py-4 bg-red-500/10 border border-red-500/20 rounded-2xl"><p className="text-red-500 text-xs font-black uppercase">Kayıt Bulunamadı!</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}