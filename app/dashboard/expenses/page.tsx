'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, Trash2, Edit, Save, X, Loader2, Tag } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<any>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Genel',
    customCategory: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (auth?.user) {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', auth.user.id).single();
      if (profile?.company_id) {
        const { data } = await supabase.from('expenses').select('*').eq('company_id', profile.company_id).order('expense_date', { ascending: false });
        if (data) setExpenses(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!formData.title || !formData.amount) return alert("Eksik alanları doldurun!");
    setSaving(true);
    
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', auth.user?.id).single();

      const finalCategory = isCustomCategory ? formData.customCategory : formData.category;

      const payload = {
        title: formData.title,
        category: finalCategory || 'Genel',
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        notes: formData.notes,
        company_id: profile?.company_id
      };

      if (currentExpense) {
        await supabase.from('expenses').update(payload).eq('id', currentExpense.id);
      } else {
        await supabase.from('expenses').insert([payload]);
      }
      
      setIsModalOpen(false);
      setIsCustomCategory(false);
      setFormData({ title: '', category: 'Genel', customCategory: '', amount: '', expense_date: new Date().toISOString().split('T')[0], notes: '' });
      fetchData();
    } catch (e) {
      console.log(e);
    }
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1B2559]">Giderler</h1>
        <button 
          onClick={() => { 
            setCurrentExpense(null); 
            setFormData({title:'', category:'Genel', customCategory:'', amount:'', expense_date:new Date().toISOString().split('T')[0], notes:''}); 
            setIsCustomCategory(false);
            setIsModalOpen(true); 
          }} 
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={20}/> Yeni Gider
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
              <tr>
                <th className="p-4">Harcama</th>
                <th className="p-4 text-center">Tarih</th>
                <th className="p-4 text-right">Tutar</th>
                <th className="p-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center p-10"><Loader2 className="animate-spin mx-auto text-blue-600"/></td></tr>
              ) : expenses.map((exp: any) => (
                <tr key={exp.id} className="border-t hover:bg-gray-50 text-sm">
                  <td className="p-4">
                    <div className="font-bold text-[#1B2559]">{exp.title}</div>
                    <div className="text-[10px] text-blue-500 font-bold uppercase">{exp.category}</div>
                  </td>
                  <td className="p-4 text-center text-gray-500">{new Date(exp.expense_date).toLocaleDateString('tr-TR')}</td>
                  <td className="p-4 text-right font-bold text-red-600">₺{exp.amount}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => { 
                      setCurrentExpense(exp); 
                      setFormData({title:exp.title, category:exp.category, customCategory:'', amount:exp.amount.toString(), expense_date:exp.expense_date, notes:exp.notes || ''}); 
                      setIsCustomCategory(false);
                      setIsModalOpen(true); 
                    }} className="text-blue-600"><Edit size={18}/></button>
                    <button onClick={async () => { if(confirm("Silmek istiyor musun?")) { await supabase.from('expenses').delete().eq('id', exp.id); fetchData(); } }} className="text-red-600"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Gider Kaydı</h2>
              <button onClick={() => setIsModalOpen(false)}><X/></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Harcama Başlığı" className="w-full p-3 border rounded-xl outline-none" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Tutar" className="w-full p-3 border rounded-xl outline-none" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                <select 
                  className="w-full p-3 border rounded-xl outline-none" 
                  value={isCustomCategory ? "Diger" : formData.category}
                  onChange={(e) => {
                    if(e.target.value === "Diger") {
                      setIsCustomCategory(true);
                    } else {
                      setIsCustomCategory(false);
                      setFormData({...formData, category: e.target.value});
                    }
                  }}
                >
                  <option value="Genel">Genel</option>
                  <option value="Kira">Kira</option>
                  <option value="Fatura">Fatura</option>
                  <option value="Personel">Personel</option>
                  <option value="Mutfak">Mutfak</option>
                  <option value="Diger">Yeni Ekle...</option>
                </select>
              </div>

              {isCustomCategory && (
                <input 
                  placeholder="Yeni Kategori Adı" 
                  className="w-full p-3 border border-blue-200 bg-blue-50 rounded-xl outline-none" 
                  value={formData.customCategory} 
                  onChange={(e) => setFormData({...formData, customCategory: e.target.value})} 
                />
              )}

              <input type="date" className="w-full p-3 border rounded-xl outline-none" value={formData.expense_date} onChange={(e) => setFormData({...formData, expense_date: e.target.value})} />
              
              <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
                {saving ? <Loader2 className="animate-spin mx-auto" /> : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}