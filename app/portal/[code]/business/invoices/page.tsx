'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, Search, FileText, Plus, X,
  CheckCircle2, Clock, AlertTriangle, Printer, Download, Eye, Tag, TrendingDown, Settings
} from 'lucide-react';
import Link from 'next/link';

export default function BusinessInvoicesPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [company, setCompany] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ invoice_no: '', customer_name: '', total: '', status: 'Beklemede' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    setLoading(true);
    let { data: compData } = await supabase.from('companies').select('*').eq('id', code).single();
    if (!compData) {
        const { data: nameData } = await supabase.from('companies').select('*').eq('name', code).single();
        compData = nameData;
    }

    if (compData) {
        setCompany(compData);
        const { data: invData } = await supabase
            .from('invoices')
            .select('*')
            .eq('company_id', compData.id)
            .order('created_at', { ascending: false });

        if (invData) setInvoices(invData);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (code) fetchData();
  }, [code, supabase]);

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const { error } = await supabase.from('invoices').insert([{
            company_id: company.id, invoice_no: formData.invoice_no, customer_name: formData.customer_name, total: Number(formData.total), status: formData.status
        }]);
        if (error) throw error;
        alert("Fatura Başarıyla Kesildi! ✅");
        setIsModalOpen(false);
        setFormData({ invoice_no: '', customer_name: '', total: '', status: 'Beklemede' });
        fetchData();
    } catch (err: any) { alert("Hata: " + err.message); } finally { setIsSaving(false); }
  };

  const filteredInvoices = invoices.filter(inv => 
      inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#3063E9]" size={50} /><p className="text-[#3063E9]/50 font-black uppercase tracking-widest text-xs mt-4">Mali Veriler Senkronize Ediliyor...</p></div>;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex font-sans selection:bg-[#3063E9]/30 overflow-x-hidden">
      <aside className="fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] hidden lg:flex shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(48,99,233,0.3)]"><Rocket size={26} className="text-white" /></div>
            <div>
              <span className="text-2xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-[#3063E9]">SaaS</span></span>
              <p className="text-[8px] font-black text-[#BC13FE] uppercase tracking-[0.3em]">Business Intelligence</p>
            </div>
        </div>
        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}/business`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><LayoutDashboard size={20} className="group-hover:text-[#3063E9]"/> Komuta Merkezi</Link>
          <Link href={`/portal/${code}/business/products`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Package size={20} className="group-hover:text-[#3063E9]" /> Ürün Yönetimi</Link>
          <Link href={`/portal/${code}/business/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><ShoppingCart size={20} className="group-hover:text-[#3063E9]" /> Gelen Siparişler</Link>
          <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#3063E9]/20 to-transparent border-l-4 border-[#3063E9] text-white rounded-r-xl font-bold shadow-lg"><FileText size={20} className="text-[#3063E9]" /> Fatura Yönetimi</div>
          <Link href={`/portal/${code}/business/customers`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Users size={20} className="group-hover:text-[#3063E9]" /> Bayi Ağı</Link>
          <Link href={`/portal/${code}/business/expenses`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><TrendingDown size={20} className="group-hover:text-red-500 transition-colors" /> Gider Takibi</Link>
          
          {/* SİSTEM AYARLARI EKLENDİ */}
          <Link href={`/portal/${code}/business/settings`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group mt-4"><Settings size={20} className="group-hover:text-gray-400 transition-colors" /> Sistem Ayarları</Link>
        </nav>
        <button onClick={() => router.push('/portal')} className="flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all mt-auto group"><LogOut size={20} /></button>
      </aside>

      <main className="flex-1 lg:ml-72 p-4 md:p-10">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12 bg-[#0F1219] p-8 rounded-[40px] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#0B0E14] rounded-2xl border border-[#3063E9]/20"><FileText className="text-[#3063E9]" size={32} /></div>
            <div>
                <h2 className="text-3xl font-black tracking-tight uppercase italic text-white">E-Fatura Portalı</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">İşletme: <span className="text-[#BC13FE]">{company?.name}</span></p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="w-full sm:w-80 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#3063E9] transition-colors" size={20} />
              <input type="text" placeholder="FATURA ARA..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0B0E14] border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-xs font-bold focus:border-[#3063E9]/50 transition-all outline-none placeholder:text-gray-700 uppercase" />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto px-8 py-4 bg-[#3063E9] text-white text-xs font-black rounded-2xl uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(48,99,233,0.3)] hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3"><Plus size={20} /> Yeni Fatura Kes</button>
          </div>
        </div>

        <div className="bg-[#0F1219] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#0B0E14] border-b border-white/5">
                        <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Fatura No / Bayi</th>
                        <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Tutar</th>
                        <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Durum</th>
                        <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">İşlemler</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredInvoices.length === 0 ? (
                        <tr><td colSpan={4} className="p-10 text-center text-gray-600 font-bold uppercase text-xs tracking-widest">Kayıtlı fatura bulunamadı.</td></tr>
                    ) : (
                        filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#0B0E14] rounded-xl border border-white/5 flex items-center justify-center text-[#3063E9] group-hover:scale-110 transition-transform"><FileText size={18}/></div>
                                    <div>
                                        <p className="text-sm font-black text-white tracking-tight">{inv.invoice_no}</p>
                                        <p className="text-[10px] font-bold text-gray-600 uppercase mt-1 tracking-widest">{inv.customer_name}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-6 text-right font-black text-white">{Number(inv.total).toLocaleString('tr-TR')} ₺</td>
                            <td className="p-6 text-center">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${inv.status === 'Ödendi' ? 'bg-green-500/10 text-green-500 border-green-500/20' : inv.status === 'Beklemede' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{inv.status}</span>
                            </td>
                            <td className="p-6">
                                <div className="flex items-center justify-center gap-2">
                                    <button className="p-2.5 bg-white/5 hover:bg-[#3063E9] text-gray-500 hover:text-white rounded-xl transition-all"><Eye size={16}/></button>
                                    <button className="p-2.5 bg-white/5 hover:bg-green-500 text-gray-500 hover:text-white rounded-xl transition-all"><Printer size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
      </main>

      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <div className="bg-[#0F1219] w-full max-w-lg rounded-[45px] border border-[#3063E9]/30 shadow-[0_0_100px_rgba(48,99,233,0.2)] overflow-hidden">
                  <div className="bg-gradient-to-r from-[#3063E9]/20 to-transparent p-8 flex justify-between items-center border-b border-white/5">
                      <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white flex items-center gap-4"><FileText className="text-[#3063E9]" /> Fatura Protokolü</h2>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white p-2.5 bg-white/5 rounded-full"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleSaveInvoice} className="p-10 space-y-6 bg-[#0B0E14]">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-600 ml-1">Fatura No</label>
                          <input type="text" required value={formData.invoice_no} onChange={(e) => setFormData({...formData, invoice_no: e.target.value})} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-[#3063E9] outline-none text-white uppercase" placeholder="FTR-001" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-600 ml-1">Toplam Tutar (₺)</label>
                          <input type="number" required value={formData.total} onChange={(e) => setFormData({...formData, total: e.target.value})} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-[#3063E9] outline-none text-white" placeholder="0.00" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-600 ml-1">Bayi İsmi</label>
                        <input type="text" required value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-[#3063E9] outline-none text-white uppercase" placeholder="BAYİ ADI" />
                      </div>
                      <button type="submit" disabled={isSaving} className="w-full py-6 bg-[#3063E9] text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-[0_10px_40px_rgba(48,99,233,0.4)] flex items-center justify-center gap-4 transition-all">
                          {isSaving ? <Loader2 size={22} className="animate-spin" /> : <CheckCircle2 size={22} />} Faturayı Onayla
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}