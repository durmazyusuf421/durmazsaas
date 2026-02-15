'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Wallet, Plus, Loader2, Trash2, ArrowDownRight, Calendar, Receipt, X } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Yeni Gider Formu
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Ofis / Dükkan',
    description: '',
    expense_date: new Date().toISOString().split('T')[0] // Bugünün tarihi
  });

  const categories = ['Ofis / Dükkan', 'Kira', 'Faturalar (Elektrik, Su, İnternet)', 'Personel / Maaş', 'Yakıt / Araç', 'Vergi / Muhasebe', 'Diğer'];

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) return;

      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (data) setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

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

      setIsModalOpen(false);
      setNewExpense({ ...newExpense, amount: '', description: '' }); // Formu temizle
      fetchExpenses();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // 🗑️ GİDERİ SİL
  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Bu gider kaydını silmek istediğinize emin misiniz?")) return;
    try {
      await supabase.from('expenses').delete().eq('id', id);
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  // Toplam Gideri Hesapla
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="p-4 md:p-8 space-y-6 text-[#1B2559]">
      
      {/* BAŞLIK VE BUTON */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Giderler & Masraflar</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">İşletmenizin cebinden çıkan tüm parayı takip edin.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-red-200 active:scale-95 transition-all">
          <Plus size={20} /> Masraf Ekle
        </button>
      </div>

      {/* TOPLAM GİDER KARTI */}
      <div className="bg-gradient-to-br from-red-500 to-red-700 p-8 rounded-[32px] text-white shadow-xl shadow-red-200 flex items-center justify-between">
        <div>
          <p className="text-red-100 font-bold uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
            <ArrowDownRight size={18} /> Toplam Çıkan Para
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
            ₺{totalExpenses.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
          <Wallet size={32} className="text-white" />
        </div>
      </div>

      {/* GİDER TABLOSU */}
      <div className="bg-white border border-gray-100 rounded-[30px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-gray-50/50 border-b border-gray-50">
              <tr>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Tarih</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Kategori & Açıklama</th>
                <th className="p-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Tutar</th>
                <th className="p-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-red-500" size={32}/></td></tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <Receipt size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-medium">Henüz bir gider kaydı girmediniz.</p>
                  </td>
                </tr>
              ) : expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-2 font-bold text-gray-500 text-sm">
                      <Calendar size={16} /> {new Date(exp.expense_date).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="font-black text-[#1B2559] uppercase">{exp.category}</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">{exp.description || 'Açıklama yok'}</p>
                  </td>
                  <td className="p-5 text-right font-black text-lg tracking-tight text-red-500">
                    - ₺{Number(exp.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-5 text-center">
                    <button onClick={() => handleDeleteExpense(exp.id)} className="p-2.5 bg-gray-50 hover:bg-red-500 hover:text-white text-gray-400 rounded-xl transition-all shadow-sm" title="Gideri Sil">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔴 YENİ GİDER EKLEME MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
              <X size={24} />
            </button>

            <h2 className="text-2xl font-black tracking-tighter uppercase text-[#1B2559] mb-6">Masraf / Gider Ekle</h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tutar (₺)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-red-500 font-black text-2xl text-red-600 transition-all" 
                  value={newExpense.amount} 
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})} 
                />
              </div>

              <div className="flex gap-4">
                <div className="space-y-1 flex-[2]">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Kategori</label>
                  <select 
                    className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-[#1B2559] border border-transparent focus:border-red-500 transition-all" 
                    value={newExpense.category} 
                    onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tarih</label>
                  <input 
                    type="date" 
                    className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-500 border border-transparent focus:border-red-500 transition-all" 
                    value={newExpense.expense_date} 
                    onChange={e => setNewExpense({...newExpense, expense_date: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Açıklama / Not</label>
                <input 
                  placeholder="Örn: Dükkan kirası, araba yakıtı vb." 
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-medium text-[#1B2559] border border-transparent focus:border-red-500 transition-all" 
                  value={newExpense.description} 
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                />
              </div>

              <button 
                onClick={handleAddExpense} 
                disabled={processing} 
                className="w-full p-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-200 mt-4 flex justify-center items-center gap-2 active:scale-95 transition-all"
              >
                {processing ? <Loader2 className="animate-spin" size={20} /> : <><ArrowDownRight size={20} /> Kaydet</>}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}