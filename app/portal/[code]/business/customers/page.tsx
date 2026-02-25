'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, Menu, X, FileText, Settings, TrendingDown,
  Search, Plus, Edit, Trash2, MapPin, Phone, CheckCircle2, ShieldCheck, Zap, Wallet, Banknote, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

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
  const [companyNotFound, setCompanyNotFound] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickSearchCode, setQuickSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);

  // --- 🚀 TAHSİLAT (KASA) STATE'LERİ ---
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Nakit');
  const [paymentLoading, setPaymentLoading] = useState(false);

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
      setCompanyNotFound(false);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        let myCompany = null;

        const { data: userCompanies } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', user.id)
          .limit(1);

        if (userCompanies && userCompanies.length > 0) {
            myCompany = userCompanies[0];
        }

        if (!myCompany) {
          const decodedCode = decodeURIComponent(code).trim();
          const { data: codeCompanies } = await supabase
            .from('companies')
            .select('*')
            .ilike('name', decodedCode) 
            .limit(1);
          
          if (codeCompanies && codeCompanies.length > 0) {
             myCompany = codeCompanies[0];
          }
        }

        if (myCompany) {
          setCompany(myCompany);
          await fetchNetworkData(myCompany.id);
        } else {
          setCompanyNotFound(true);
        }
      } catch (e) { 
          setCompanyNotFound(true);
      } finally { 
          setLoading(false); 
      }
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

  // --- 🏹 AĞA EKLEME BUTONU ---
  const handleAddFromMaster = async () => {
    if (!searchResult || searchResult === 'not_found') {
        alert("Hata: Eklenecek bayi bulunamadı!");
        return;
    }
    if (!company?.id) {
        alert("Kritik Hata: İşletmenizin kimliği (Company ID) bulunamıyor.");
        return;
    }

    setAddLoading(true);
    try {
      const isExist = customers.some(c => (c.code || "").toUpperCase() === searchResult.code.toUpperCase());
      if (isExist) {
        alert("⚠️ Bu bayi zaten ağınızda mevcut.");
        setAddLoading(false);
        return;
      }

      const insertData = {
        company_id: company.id,
        name: searchResult.name,
        code: searchResult.code,
        city: searchResult.city || 'Bulut Kaydı',
        phone: searchResult.phone || '-',
        balance: 0,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([insertData])
        .select();

      if (error) { 
          alert(`Siber Veritabanı Hatası: ${error.message}`);
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
    } catch (e: any) { 
        alert(`Beklenmeyen bir sistem hatası oluştu: ${e?.message || 'Bilinmiyor'}`); 
    } finally {
        setAddLoading(false);
    }
  };

  // --- 💰 TAHSİLAT (KASA) MOTORU ---
  const handleReceivePayment = async () => {
    if (!selectedCustomer || !paymentAmount || isNaN(Number(paymentAmount))) return;
    
    setPaymentLoading(true);
    try {
        const amount = Number(paymentAmount);
        
        const { error: tError } = await supabase.from('transactions').insert([{
            company_id: company.id,
            customer_id: selectedCustomer.id,
            type: 'TAHSİLAT',
            amount: amount,
            description: `${paymentMethod} ile tahsilat yapıldı.`
        }]);
        
        if (tError) throw tError;

        const currentBalance = Number(selectedCustomer.balance) || 0;
        const newBalance = currentBalance - amount;

        const { error: cError } = await supabase
            .from('customers')
            .update({ balance: newBalance })
            .eq('id', selectedCustomer.id);
            
        if (cError) throw cError;

        alert(`✅ ${amount.toLocaleString('tr-TR')} ₺ başarıyla tahsil edildi!`);
        await fetchNetworkData(company.id);
        setPaymentModalOpen(false);
        setPaymentAmount('');
    } catch (e: any) {
        alert("Tahsilat alınırken hata oluştu: " + e.message);
    } finally {
        setPaymentLoading(false);
    }
  };

  if (loading) return <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#3063E9] mb-4" size={50} /><p className="text-[#3063E9] text-[10px] font-black uppercase tracking-widest animate-pulse">Siber Ağ Yükleniyor...</p></div>;

  if (companyNotFound) {
      return (
          <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center text-center p-6 selection:bg-[#3063E9]/30">
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <AlertTriangle size={40} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic mb-2 tracking-wide">İşletme Kimliği Bulunamadı</h2>
              <p className="text-gray-500 text-sm font-bold max-w-md mb-8 leading-relaxed uppercase tracking-widest">
                  Görünüşe göre bu hesaba ait geçerli bir işletme kaydı yok veya siber zırh (RLS) erişiminizi engelledi. Lütfen hesabınızdan çıkış yapıp doğru hesapla tekrar girin.
              </p>
              <button 
                  onClick={async () => {
                      await supabase.auth.signOut();
                      router.push('/login');
                  }} 
                  className="px-8 py-4 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all flex items-center gap-3"
              >
                  <LogOut size={18} /> Sistemden Çık ve Yeniden Gir
              </button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#3063E9]/30 overflow-x-hidden relative">
      
      {/* 🚀 SİBER YAMA: EKSİKSİZ, 7'Lİ STANDART SOL MENÜ (Bayi Ağı Aktif) */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 print:hidden`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#3063E9] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20"><Rocket size={22} className="text-white" /></div>
          <span className="text-xl font-black italic uppercase leading-none text-white">Durmaz<span className="text-[#3063E9]">SaaS</span></span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto text-gray-500"><X /></button>
        </div>
        
        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}/business`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><LayoutDashboard size={20}/> Komuta Merkezi</Link>
          <Link href={`/portal/${code}/business/products`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><Package size={20}/> Ürün Yönetimi</Link>
          <Link href={`/portal/${code}/business/orders`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><ShoppingCart size={20}/> Gelen Siparişler</Link>
          <Link href={`/portal/${code}/business/billing`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><FileText size={20}/> Fatura Yönetimi</Link>
          
          {/* Aktif Olan Bayi Ağı Sekmesi */}
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9]/10 border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold transition-all"><Users size={20} className="text-[#3063E9]" /> Bayi Ağı</button>
          
          <Link href={`/portal/${code}/business/expenses`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><TrendingDown size={20}/> Gider Takibi</Link>
          <Link href={`/portal/${code}/business/settings`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><Settings size={20}/> Sistem Ayarları</Link>
        </nav>

        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="mt-auto flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all hover:bg-red-500/10 group">
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Güvenli Çıkış
        </button>
      </aside>

      {/* ANA İÇERİK */}
      <main className="lg:ml-72 p-6 md:p-10 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3063E9]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-white/5 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-[#0F1219] rounded-lg border border-white/5"><Menu size={20} /></button>
            <h2 className="text-3xl font-black uppercase italic">Bayi Ağı</h2>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => setIsQuickAddModalOpen(true)} className="flex-1 md:flex-none px-6 py-3 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all shadow-lg"><Zap size={16} className="text-yellow-500" /> Kod ile Sorgula</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {customers.filter(c => (c.name || "").toLowerCase().includes(searchQuery.toLowerCase())).map((c) => (
            <div key={c.id} className="bg-[#0F1219] border border-white/5 p-6 rounded-[32px] space-y-4 hover:border-[#3063E9]/30 transition-all group relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#3063E9]/5 blur-3xl rounded-full" />
                <div className="flex justify-between items-start relative z-10">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-[#3063E9]/30 transition-all"><Users size={24} className="text-[#3063E9]" /></div>
                    <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase border border-green-500/20 text-green-500 bg-green-500/5">Aktif Cari</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-lg font-black uppercase text-white truncate pr-4">{c.name}</h3>
                    <p className="text-[10px] text-[#3063E9] font-bold tracking-widest mt-1">{c.code}</p>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-white/5 relative z-10">
                    <div>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Mevcut Bakiye</p>
                        <p className={`text-xl font-black italic ${c.balance < 0 ? 'text-red-400' : 'text-white'}`}>{c.balance.toLocaleString('tr-TR')} ₺</p>
                    </div>
                    
                    <button 
                        onClick={() => { setSelectedCustomer(c); setPaymentModalOpen(true); }}
                        className="px-4 py-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 transition-all border border-green-500/20 hover:scale-105"
                    >
                        <Wallet size={16}/> Tahsilat Al
                    </button>
                </div>
            </div>
          ))}
          {customers.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-50 bg-[#0F1219] rounded-[32px] border border-dashed border-white/10">
                <Users size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-sm font-black uppercase mb-2 tracking-widest">Ağınız Boş</h3>
                <p className="text-xs font-bold text-gray-500">Müşterilerinizi eklemek için "Kod ile Sorgula" butonunu kullanın.</p>
            </div>
          )}
        </div>
      </main>

      {/* --- SORGULAMA MODALI --- */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsQuickAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0F1219] border border-[#3063E9]/30 rounded-[40px] shadow-[0_0_50px_rgba(48,99,233,0.1)] overflow-hidden animate-in zoom-in-95 duration-200">
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
                      placeholder="Cari Kodu Yazın (Örn: CARI-123)" 
                      className="w-full bg-[#020408] border border-white/10 rounded-2xl p-5 text-sm font-bold outline-none focus:border-[#3063E9] text-center uppercase transition-all shadow-inner" 
                    />
                    <button onClick={handleQuickSearch} disabled={searchLoading} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#3063E9] text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg">
                        {searchLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                    </button>
                </div>

                {searchResult && searchResult !== 'not_found' && (
                    <div className="bg-gradient-to-br from-[#3063E9]/10 to-transparent border border-[#3063E9]/30 rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#3063E9] text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(48,99,233,0.4)]"><ShieldCheck size={24} /></div>
                            <div>
                                <h4 className="font-black uppercase text-sm mb-1 text-white">{searchResult.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{searchResult.code}</p>
                            </div>
                        </div>
                        <button onClick={handleAddFromMaster} disabled={addLoading} className="w-full py-5 bg-[#3063E9] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_0_20px_rgba(48,99,233,0.3)] flex items-center justify-center gap-2 transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50 hover:scale-[1.02]">
                          {addLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                          {addLoading ? 'EKLENİYOR...' : 'CARİYİ AĞIMA EKLE'}
                        </button>
                    </div>
                )}
                {searchResult === 'not_found' && <div className="text-center py-5 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in"><p className="text-red-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"><X size={16}/> Sistemde Bulunamadı</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* --- 💰 TAHSİLAT KASA MODALI --- */}
      {paymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setPaymentModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0F1219] border border-green-500/30 rounded-[40px] shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0B0E14]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 text-green-500 rounded-lg flex items-center justify-center"><Wallet size={16}/></div>
                    <h3 className="text-xl font-black italic uppercase text-white">Tahsilat Al</h3>
                </div>
                <button onClick={() => setPaymentModalOpen(false)} className="p-2 bg-white/5 hover:bg-red-500 rounded-xl transition-all"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-6">
                <div className="text-center pb-6 border-b border-white/5">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Müşteri / Bayi</p>
                    <h4 className="text-lg font-black uppercase text-white">{selectedCustomer.name}</h4>
                    <p className="text-xs text-gray-400 font-bold mt-2">Mevcut Bakiye: <span className="text-white">{selectedCustomer.balance.toLocaleString('tr-TR')} ₺</span></p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-2 mb-2 block">Tahsil Edilen Tutar (₺)</label>
                        <div className="relative">
                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" size={20} />
                            <input 
                                type="number" 
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                placeholder="Örn: 2500"
                                className="w-full bg-[#020408] border border-white/10 rounded-2xl p-5 pl-12 text-xl font-black italic text-white outline-none focus:border-green-500 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-2">
                        {['Nakit', 'Havale', 'Kredi Kartı'].map(method => (
                            <button 
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${paymentMethod === method ? 'bg-green-500/20 border-green-500/50 text-green-500' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'}`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleReceivePayment}
                    disabled={paymentLoading || !paymentAmount}
                    className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                    {paymentLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    {paymentLoading ? 'İŞLENİYOR...' : 'KASAYA İŞLE VE BAKİYEYİ DÜŞÜR'}
                </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3063E933; border-radius: 10px; }
      `}} />
    </div>
  );
}