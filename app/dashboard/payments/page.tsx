'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Wallet, ArrowDownRight, ArrowUpRight, Loader2, Receipt, Calendar, Trash2, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'tahsilatlar' | 'giderler'>('tahsilatlar');
  
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Gider Ekleme State'leri
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Ofis / Dükkan',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const categories = ['Ofis / Dükkan', 'Kira', 'Faturalar (Elektrik, Su, İnternet)', 'Personel / Maaş', 'Yakıt / Araç', 'Vergi / Muhasebe', 'Diğer'];

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) return;

      // 1. Tahsilatları Çek (Müşteri bilgisiyle)
      const { data: payData } = await supabase
        .from('payments')
        .select('*, customers(name, current_cari_code)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });
      if (payData) setPayments(payData);

      // 2. Giderleri Çek
      const { data: expData } = await supabase
        .from('expenses')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('expense_date', { ascending: false });
      if (expData) setExpenses(expData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFinanceData(); }, []);

  // 💸 YENİ GİDER EKLE
  const handleAddExpense = async () => {
    if (!newExpense.amount || Number(newExpense.amount) <= 0) return alert("Lütfen geçerli bir tutar girin!");
    setProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single();

      const { error } = await supabase.from('expenses').insert([{
        company_id: profile?.company_id,
        amount: Number(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        expense_date: newExpense.expense_date
      }]);

      if (error) throw error;

      setIsExpenseModalOpen(false);
      setNewExpense({ ...newExpense, amount: '', description: '' });
      fetchFinanceData();
    } catch (err: any) { alert("Hata: " + err.message); } finally { setProcessing(false); }
  };

  // 🗑️ GİDER SİL
  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Bu masrafı silmek istediğinize emin misiniz?")) return;
    try {
      await supabase.from('expenses').delete().eq('id', id);
      fetchFinanceData();
    } catch (err) { console.error(err); }
  };

  // Toplamlar
  const totalCollections = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="p-4 md:p-8 space-y-6 text-[#1B2559]">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Kasa & Finans</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">Giren tahsilatları ve çıkan masrafları tek ekrandan yönetin.</p>
        </div>
        {activeTab === 'giderler' && (
          <button onClick={() => setIsExpenseModalOpen(true)} className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-red-200 active:scale-95 transition-all">
            <Plus size={20} /> Masraf Ekle
          </button>
        )}
      </div>

      {/* ÖZET KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-700 p-8 rounded-[32px] text-white shadow-xl shadow-green-200 flex justify-between items-center">
          <div>
            <p className="text-green-100 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2"><ArrowDownRight size={16}/> Toplam Giren (Tahsilat)</p>
            <h2 className="text-4xl font-black tracking-tighter">₺{totalCollections.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h2>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><Wallet size={28}/></div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-700 p-8 rounded-[32px] text-white shadow-xl shadow-red-200 flex justify-between items-center">
          <div>
            <p className="text-red-100 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2"><ArrowUpRight size={16}/> Toplam Çıkan (Giderler)</p>
            <h2 className="text-4xl font-black tracking-tighter">₺{totalExpenses.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h2>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><Receipt size={28}/></div>
        </div>
      </div>

      {/* SEKMELER (TABS) */}
      <div className="flex gap-4 border-b border-gray-200">
        <button onClick={() => setActiveTab('tahsilatlar')} className={`pb-4 px-4 font-black uppercase tracking-widest text-sm transition-all border-b-4 ${activeTab === 'tahsilatlar' ? 'border-[#3063E9] text-[#3063E9]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
          Tahsilatlar (Giren)
        </button>
        <button onClick={() => setActiveTab('giderler')} className={`pb-4 px-4 font-black uppercase tracking-widest text-sm transition-all border-b-4 ${activeTab === 'giderler' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
          Giderler (Çıkan)
        </button>
      </div>

      {/* İÇERİK: TAHSİLATLAR */}
      {activeTab === 'tahsilatlar' && (
        <div className="bg-white border border-gray-100 rounded-[30px] overflow-hidden shadow-sm animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Tarih</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Müşteri</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Ödeme Tipi</th>
                  <th className="p-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? ( <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#3063E9]" size={32}/></td></tr> ) 
                : payments.length === 0 ? ( <tr><td colSpan={4} className="p-10 text-center text-gray-400 font-medium">Henüz tahsilat kaydı yok.</td></tr> ) 
                : payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/30">
                    <td className="p-5 font-bold text-gray-500 text-sm">{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="p-5 font-black text-[#1B2559] uppercase">{p.customers?.name}</td>
                    <td className="p-5"><span className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 uppercase">{p.payment_method}</span></td>
                    <td className="p-5 text-right font-black text-lg text-green-600">+ ₺{Number(p.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* İÇERİK: GİDERLER */}
      {activeTab === 'giderler' && (
        <div className="bg-white border border-gray-100 rounded-[30px] overflow-hidden shadow-sm animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Tarih</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Kategori & Not</th>
                  <th className="p-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Tutar</th>
                  <th className="p-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? ( <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-red-500" size={32}/></td></tr> ) 
                : expenses.length === 0 ? ( <tr><td colSpan={4} className="p-10 text-center text-gray-400 font-medium">Henüz gider kaydı yok.</td></tr> ) 
                : expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/30">
                    <td className="p-5 font-bold text-gray-500 text-sm"><div className="flex items-center gap-2"><Calendar size={16}/> {new Date(exp.expense_date).toLocaleDateString('tr-TR')}</div></td>
                    <td className="p-5"><p className="font-black text-[#1B2559] uppercase">{exp.category}</p><p className="text-xs text-gray-400 font-medium mt-1">{exp.description}</p></td>
                    <td className="p-5 text-right font-black text-lg text-red-500">- ₺{Number(exp.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-5 text-center"><button onClick={() => handleDeleteExpense(exp.id)} className="p-2.5 bg-gray-50 hover:bg-red-500 hover:text-white text-gray-400 rounded-xl transition-all"><Trash2 size={18}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🔴 GİDER EKLEME MODALI */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative">
            <button onClick={() => setIsExpenseModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl"><X size={24} /></button>
            <h2 className="text-2xl font-black tracking-tighter uppercase text-[#1B2559] mb-6">Masraf Ekle</h2>
            <div className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Tutar (₺)</label><input type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black text-2xl text-red-600 focus:border-red-500 border border-transparent" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} /></div>
              <div className="flex gap-4">
                <div className="space-y-1 flex-[2]"><label className="text-[10px] font-bold text-gray-400 uppercase">Kategori</label><select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-[#1B2559] focus:border-red-500 border border-transparent" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="space-y-1 flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Tarih</label><input type="date" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-500 focus:border-red-500 border border-transparent" value={newExpense.expense_date} onChange={e => setNewExpense({...newExpense, expense_date: e.target.value})} /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Açıklama</label><input className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-medium text-[#1B2559] focus:border-red-500 border border-transparent" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} /></div>
              <button onClick={handleAddExpense} disabled={processing} className="w-full p-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-200 mt-4 flex justify-center items-center gap-2">{processing ? <Loader2 className="animate-spin" size={20} /> : 'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}