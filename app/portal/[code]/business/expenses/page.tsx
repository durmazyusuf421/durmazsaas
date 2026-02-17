'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, Search, FileText, Plus, X, CheckCircle2,
  TrendingDown, Wallet, Receipt, CreditCard, Fuel, Zap, Building2, Settings
} from 'lucide-react';
import Link from 'next/link';

export default function BusinessExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [company, setCompany] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ title: '', amount: '', category: 'Yakıt' });

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
        const { data: expData } = await supabase.from('expenses').select('*').eq('company_id', compData.id).order('created_at', { ascending: false });
        if (expData && expData.length > 0) setExpenses(expData);
    }
    setLoading(false);
  };

  useEffect(() => { if (code) fetchData(); }, [code, supabase]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setIsSaving(true);
    try {
        const { error } = await supabase.from('expenses').insert([{ company_id: company.id, title: formData.title, amount: Number(formData.amount), category: formData.category }]);
        if (error) throw error;
        alert("Gider Başarıyla Kaydedildi! ✅");
        setIsModalOpen(false);
        setFormData({ title: '', amount: '', category: 'Yakıt' });
        fetchData();
    } catch (err: any) { alert("Hata: " + err.message); } finally { setIsSaving(false); }
  };

  const filteredExpenses = expenses.filter(exp => exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) || exp.category?.toLowerCase().includes(searchTerm.toLowerCase()));

  const getCategoryIcon = (category: string) => {
      switch(category) {
          case 'Yakıt': return <Fuel size={20} className="text-orange-500" />;
          case 'Kira': return <Building2 size={20} className="text-[#BC13FE]" />;
          case 'Fatura': return <Zap size={20} className="text-yellow-500" />;
          case 'Personel': return <Users size={20} className="text-[#3063E9]" />;
          default: return <Receipt size={20} className="text-gray-400" />;
      }
  };

  if (loading) return <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center"><Loader2 className="animate-spin text-red-500" size={50} /></div>;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex font-sans selection:bg-red-500/30 overflow-x-hidden">
      
      <aside className="fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] hidden lg:flex shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(48,99,233,0.3)]"><Rocket size={26} className="text-white" /></div>
            <div><span className="text-2xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-[#3063E9]">SaaS</span></span></div>
        </div>
        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}/business`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><LayoutDashboard size={20} className="group-hover:text-[#3063E9]"/> Komuta Merkezi</Link>
          <Link href={`/portal/${code}/business/products`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Package size={20} className="group-hover:text-[#3063E9]" /> Ürün Yönetimi</Link>
          <Link href={`/portal/${code}/business/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><ShoppingCart size={20} className="group-hover:text-[#3063E9]" /> Gelen Siparişler</Link>
          <Link href={`/portal/${code}/business/invoices`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><FileText size={20} className="group-hover:text-[#3063E9]" /> Fatura Yönetimi</Link>
          <Link href={`/portal/${code}/business/customers`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Users size={20} className="group-hover:text-[#3063E9]" /> Bayi Ağı</Link>
          <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-red-500/20 to-transparent border-l-4 border-red-500 text-white rounded-r-xl font-bold shadow-[0_0_30px_rgba(239,68,68,0.1)]"><TrendingDown size={20} className="text-red-500" /> Gider Takibi</div>
          
          {/* SİSTEM AYARLARI EKLENDİ */}
          <Link href={`/portal/${code}/business/settings`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group mt-4"><Settings size={20} className="group-hover:text-gray-400 transition-colors" /> Sistem Ayarları</Link>
        </nav>
        <button onClick={() => router.push('/portal')} className="flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all mt-auto group"><LogOut size={20} /> Güvenli Çıkış</button>
      </aside>

      <main className="flex-1 lg:ml-72 p-4 md:p-10">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12 bg-[#0F1219] p-8 rounded-[40px] border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#0B0E14] rounded-2xl border border-red-500/20"><TrendingDown className="text-red-500" size={32} /></div>
            <div><h2 className="text-3xl font-black tracking-tight uppercase italic text-white">Gider Yönetimi</h2><p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">İşletme: <span className="text-[#BC13FE]">{company?.name || '...'}</span></p></div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="w-full sm:w-80 relative group"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 transition-colors" size={20} /><input type="text" placeholder="GİDER ARA..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0B0E14] border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-xs font-bold focus:border-red-500/50 transition-all outline-none placeholder:text-gray-700 uppercase" /></div>
            <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto px-8 py-4 bg-red-600 text-white text-xs font-black rounded-2xl uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:bg-red-500 transition-all active:scale-95 flex items-center justify-center gap-3"><Plus size={20} /> Yeni Gider Ekle</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredExpenses.map((exp) => (
                <div key={exp.id} className="bg-[#0F1219] rounded-[35px] border border-white/5 p-6 flex items-center justify-between hover:border-red-500/30 transition-all group shadow-lg">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-[#0B0E14] border border-white/5 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">{getCategoryIcon(exp.category)}</div>
                        <div><h4 className="font-black uppercase text-sm text-gray-200 group-hover:text-white transition-colors">{exp.title}</h4><div className="flex items-center gap-3 mt-2"><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-[#0B0E14] px-3 py-1 rounded-lg border border-white/5">{exp.category}</span></div></div>
                    </div>
                    <div className="text-right"><p className="text-xl font-black text-red-500 group-hover:text-red-400 transition-colors">- {Number(exp.amount).toLocaleString('tr-TR')} ₺</p></div>
                </div>
            ))}
        </div>
      </main>

      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <div className="bg-[#0F1219] w-full max-w-lg rounded-[45px] border border-red-500/30 shadow-[0_0_100px_rgba(239,68,68,0.15)] overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500/20 to-transparent p-8 flex justify-between items-center border-b border-white/5"><h2 className="text-lg font-black uppercase tracking-[0.2em] text-white flex items-center gap-4"><CreditCard className="text-red-500" /> Çıkış Protokolü</h2><button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white p-2.5 bg-white/5 rounded-full transition-all"><X size={24}/></button></div>
                  <form onSubmit={handleSaveExpense} className="p-10 space-y-8 bg-[#0B0E14]">
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Gider Başlığı</label><input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-red-500 outline-none transition-all uppercase placeholder:text-gray-800 text-white" /></div>
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Tutar (₺)</label><input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-red-500 outline-none text-white" /></div>
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Kategori</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#0F1219] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-red-500 outline-none text-white appearance-none"><option value="Yakıt">YAKIT</option><option value="Kira">KİRA</option><option value="Fatura">FATURA</option><option value="Personel">PERSONEL</option><option value="Diğer">DİĞER</option></select></div>
                      </div>
                      <button type="submit" disabled={isSaving} className="w-full py-6 bg-red-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-[0_10px_40px_rgba(220,38,38,0.4)] hover:bg-red-500 active:scale-[0.98] transition-all flex items-center justify-center gap-4">{isSaving ? <Loader2 size={22} className="animate-spin" /> : <CheckCircle2 size={22} />} Gideri Onayla</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}