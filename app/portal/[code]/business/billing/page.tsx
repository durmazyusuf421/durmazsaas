'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, Menu, X, FileText, Settings, TrendingDown,
  Search, FileCheck, Banknote, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertTriangle, Eye, Printer
} from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  description: string;
  customers?: { name: string; code: string };
  items?: any[];
}

export default function BusinessBilling() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || '';
  
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [loading, setLoading] = useState(true);
  const [companyNotFound, setCompanyNotFound] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      setCompanyNotFound(false);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        let myCompany = null;
        const { data: userCompanies } = await supabase.from('companies').select('*').eq('owner_id', user.id).limit(1);
        if (userCompanies && userCompanies.length > 0) myCompany = userCompanies[0];

        if (!myCompany) {
          const decodedCode = decodeURIComponent(code).trim();
          const { data: codeCompanies } = await supabase.from('companies').select('*').ilike('name', decodedCode).limit(1);
          if (codeCompanies && codeCompanies.length > 0) myCompany = codeCompanies[0];
        }

        if (myCompany) {
          setCompany(myCompany);
          
          const { data: transData, error } = await supabase
            .from('transactions')
            .select(`*, customers(name, code)`)
            .eq('company_id', myCompany.id)
            .order('created_at', { ascending: false });

          if (!error && transData) {
            setTransactions(transData as Transaction[]);
          }
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

  const filteredTransactions = transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (t.customers?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'ALL' ? true : t.type === filterType;
      return matchesSearch && matchesType;
  });

  const totalTahsilat = transactions.filter(t => t.type === 'TAHSİLAT').reduce((acc, curr) => acc + curr.amount, 0);
  const totalFatura = transactions.filter(t => t.type === 'FATURA').reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) return <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#3063E9] mb-4" size={50} /><p className="text-[#3063E9] text-[10px] font-black uppercase tracking-widest animate-pulse">Finans Verileri Yükleniyor...</p></div>;

  if (companyNotFound) {
      return (
          <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center text-center p-6">
              <AlertTriangle size={40} className="text-red-500 mb-4" />
              <h2 className="text-2xl font-black text-white uppercase italic mb-2">İşletme Kimliği Bulunamadı</h2>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="mt-4 px-8 py-4 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase text-[11px] flex items-center gap-3">
                  <LogOut size={18} /> Sistemden Çık
              </button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#3063E9]/30 overflow-x-hidden relative">
      
      {/* SIDEBAR (Tam Takım Menü) */}
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
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-[#3063E9]/10 border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold transition-all"><FileText size={20} className="text-[#3063E9]"/> Fatura Yönetimi</button>
          <Link href={`/portal/${code}/business/customers`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><Users size={20}/> Bayi Ağı</Link>
          <Link href={`/portal/${code}/business/expenses`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><TrendingDown size={20}/> Gider Takibi</Link>
          <Link href={`/portal/${code}/business/settings`} className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white rounded-xl font-bold transition-all"><Settings size={20}/> Sistem Ayarları</Link>
        </nav>

        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="mt-auto flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all hover:bg-red-500/10 group">
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Güvenli Çıkış
        </button>
      </aside>

      {/* ANA İÇERİK */}
      <main className="lg:ml-72 p-6 md:p-10 relative print:hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3063E9]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-white/5 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-[#0F1219] rounded-lg border border-white/5"><Menu size={20} /></button>
            <h2 className="text-3xl font-black uppercase italic">Fatura Yönetimi</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-[#0F1219] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3063E9]/5 blur-3xl rounded-full" />
                <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="w-12 h-12 bg-[#3063E9]/10 text-[#3063E9] rounded-xl flex items-center justify-center"><FileCheck size={24}/></div>
                    <div><h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Kesilen Toplam Fatura</h3><p className="text-sm font-bold text-white mt-1">Sipariş / Satışlar</p></div>
                </div>
                <p className="text-4xl font-black italic text-white mt-4 relative z-10">{totalFatura.toLocaleString('tr-TR')} ₺</p>
            </div>
            
            <div className="bg-[#0F1219] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full" />
                <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center"><Banknote size={24}/></div>
                    <div><h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Alınan Toplam Tahsilat</h3><p className="text-sm font-bold text-white mt-1">Kasa Girişi</p></div>
                </div>
                <p className="text-4xl font-black italic text-green-500 mt-4 relative z-10">{totalTahsilat.toLocaleString('tr-TR')} ₺</p>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type="text" placeholder="İşlem açıklaması veya müşteri ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#0F1219] border border-white/5 rounded-2xl py-4 pl-12 text-sm font-bold text-white outline-none focus:border-[#3063E9]/50 transition-all shadow-inner" />
            </div>
            <div className="flex gap-2">
                <button onClick={() => setFilterType('ALL')} className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${filterType === 'ALL' ? 'bg-[#3063E9] text-white' : 'bg-[#0F1219] text-gray-500 hover:text-white border border-white/5'}`}>Tümü</button>
                <button onClick={() => setFilterType('FATURA')} className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${filterType === 'FATURA' ? 'bg-[#3063E9] text-white' : 'bg-[#0F1219] text-gray-500 hover:text-white border border-white/5'}`}>Faturalar</button>
                <button onClick={() => setFilterType('TAHSİLAT')} className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${filterType === 'TAHSİLAT' ? 'bg-green-500 text-white' : 'bg-[#0F1219] text-gray-500 hover:text-white border border-white/5'}`}>Tahsilatlar</button>
            </div>
        </div>

        <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
                <div className="py-20 text-center opacity-50 bg-[#0F1219] rounded-[32px] border border-dashed border-white/10">
                    <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-sm font-black uppercase mb-2 tracking-widest">Kayıt Bulunamadı</h3>
                    <p className="text-xs font-bold text-gray-500">Bu kriterlere uygun bir finansal hareket yok.</p>
                </div>
            ) : (
                filteredTransactions.map((t, idx) => (
                    <div key={idx} className="bg-[#0F1219] border border-white/5 p-5 rounded-[24px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-[#3063E9]/30 transition-all">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'FATURA' ? 'bg-[#3063E9]/10 text-[#3063E9]' : 'bg-green-500/10 text-green-500'}`}>
                                {t.type === 'FATURA' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase text-white mb-1">{t.customers?.name || 'Bilinmeyen Müşteri'}</h4>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${t.type === 'FATURA' ? 'bg-[#3063E9]/20 text-[#3063E9]' : 'bg-green-500/20 text-green-500'}`}>{t.type}</span>
                                    <p className="text-[10px] text-gray-500 font-bold">{new Date(t.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-1/3 px-4"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{t.description}</p></div>
                        <div className="flex items-center justify-between w-full md:w-auto gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                            <div className="text-right"><span className={`text-xl font-black italic ${t.type === 'FATURA' ? 'text-white' : 'text-green-500'}`}>{t.type === 'FATURA' ? '+' : '+'}{t.amount.toLocaleString('tr-TR')} ₺</span></div>
                            <button onClick={() => setSelectedTransaction(t)} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"><Eye size={18} /></button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </main>

      {selectedTransaction && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 print:static print:p-0 print:block">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm print:hidden" onClick={() => setSelectedTransaction(null)} />
            <div className="relative w-full max-w-[600px] bg-[#0F1219] border border-white/10 shadow-2xl rounded-[40px] flex flex-col max-h-[90vh] print:max-h-none print:w-full print:border-none print:bg-white print:text-black print:rounded-none animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex justify-between items-center print:hidden bg-[#0B0E14]">
                    <h3 className="text-lg font-black uppercase italic text-white flex items-center gap-2"><FileText className="text-[#3063E9]"/> İşlem Detayı</h3>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="p-2 bg-[#3063E9]/20 text-[#3063E9] hover:bg-[#3063E9] hover:text-white rounded-xl transition-all"><Printer size={20} /></button>
                        <button onClick={() => setSelectedTransaction(null)} className="p-2 bg-white/5 hover:bg-red-500 rounded-xl transition-all"><X size={20} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 print:p-10 custom-scrollbar">
                    <div className="text-center mb-8 border-b border-white/10 print:border-black/20 pb-8">
                        <div className="w-16 h-16 bg-[#3063E9] rounded-2xl flex items-center justify-center mx-auto mb-4 print:bg-black print:text-white print:rounded-none"><Rocket size={32} /></div>
                        <h2 className="text-2xl font-black italic uppercase text-white print:text-black">DURMAZ SAAS</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-widest print:text-gray-700">Resmi Finansal Kayıt Belgesi</p>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-[#020408] p-5 rounded-2xl border border-white/5 print:bg-transparent print:border-black/20 print:p-4">
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1 print:text-gray-600">Cari İşletme</p>
                            <p className="text-lg font-black uppercase text-white print:text-black">{selectedTransaction.customers?.name}</p>
                            <p className="text-[10px] text-[#3063E9] font-bold tracking-widest mt-1 print:text-black">{selectedTransaction.customers?.code}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#020408] p-5 rounded-2xl border border-white/5 print:bg-transparent print:border-black/20 print:p-4">
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1 print:text-gray-600">İşlem Tipi</p>
                                <p className={`text-sm font-black uppercase ${selectedTransaction.type === 'FATURA' ? 'text-[#3063E9]' : 'text-green-500'} print:text-black`}>{selectedTransaction.type}</p>
                            </div>
                            <div className="bg-[#020408] p-5 rounded-2xl border border-white/5 print:bg-transparent print:border-black/20 print:p-4">
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1 print:text-gray-600">İşlem Tarihi</p>
                                <p className="text-sm font-black uppercase text-white print:text-black">{new Date(selectedTransaction.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                        <div className="bg-[#020408] p-5 rounded-2xl border border-white/5 print:bg-transparent print:border-black/20 print:p-4">
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2 print:text-gray-600">Açıklama / Detay</p>
                            <p className="text-sm font-bold text-gray-300 print:text-black leading-relaxed">{selectedTransaction.description}</p>
                            {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/10 print:border-black/20">
                                    <table className="w-full text-[10px] font-bold uppercase">
                                        <thead><tr className="text-gray-500 text-left"><th className="pb-2">Ürün</th><th className="pb-2 text-center">Miktar</th><th className="pb-2 text-right">Tutar</th></tr></thead>
                                        <tbody>
                                            {selectedTransaction.items.map((it:any, i:number) => (
                                                <tr key={i} className="text-gray-300 print:text-black"><td className="py-1">{it.name}</td><td className="py-1 text-center">{it.qty}</td><td className="py-1 text-right">{it.price} ₺</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className={`p-6 rounded-3xl border print:bg-gray-100 print:border-black/30 print:rounded-none flex justify-between items-center ${selectedTransaction.type === 'FATURA' ? 'bg-[#3063E9]/10 border-[#3063E9]/20' : 'bg-green-500/10 border-green-500/20'}`}>
                            <p className="text-[11px] uppercase font-black tracking-widest print:text-black">İşlem Tutarı</p>
                            <p className={`text-4xl font-black italic ${selectedTransaction.type === 'FATURA' ? 'text-white' : 'text-green-500'} print:text-black`}>
                                {selectedTransaction.amount.toLocaleString('tr-TR')} ₺
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3063E933; border-radius: 10px; }
        @media print { body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; } }
      `}} />
    </div>
  );
}