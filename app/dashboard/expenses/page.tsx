'use client';
import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, Trash2, Loader2, Wallet, Tag, PieChart, TrendingDown } from 'lucide-react';

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'categories'>('list');
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Veriler
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Formlar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category_id: '', expense_date: new Date().toISOString().split('T')[0] });
  const [newCategory, setNewCategory] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // VERİLERİ ÇEK
  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    
    if (profile?.company_id) {
      setCompanyId(profile.company_id);

      // Giderleri Çek
      const { data: expData } = await supabase
        .from('expenses')
        .select(`*, expense_categories(name)`)
        .eq('company_id', profile.company_id)
        .order('expense_date', { ascending: false });
      if (expData) setExpenses(expData);

      // Kategorileri Çek
      const { data: catData } = await supabase.from('expense_categories').select('*').eq('company_id', profile.company_id);
      if (catData) setCategories(catData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- KAYIT İŞLEMLERİ ---

  // 1. Yeni Gider Ekle
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);

    const { error } = await supabase.from('expenses').insert([{
      company_id: companyId,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category_id: newExpense.category_id || null,
      expense_date: newExpense.expense_date
    }]);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      setIsModalOpen(false);
      setNewExpense({ description: '', amount: '', category_id: '', expense_date: new Date().toISOString().split('T')[0] });
      fetchData();
    }
    setSaving(false);
  };

  // 2. Yeni Kategori Ekle
  const handleSaveCategory = async () => {
    if (!newCategory.trim() || !companyId) return;
    setSaving(true);
    const { error } = await supabase.from('expense_categories').insert([{ name: newCategory, company_id: companyId }]);
    if (!error) { setNewCategory(''); fetchData(); }
    setSaving(false);
  };

  // Silme İşlemleri
  const handleDelete = async (table: string, id: string) => {
    if(!confirm("Silmek istediğine emin misin?")) return;
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  // Toplam Gider Hesabı
  const totalExpense = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* ÜST BAŞLIK */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2559]">Gider Yönetimi</h1>
          <p className="text-gray-500 text-sm">İşletmenizin harcamalarını takip edin.</p>
        </div>
        
        {/* TOPLAM KARTI */}
        <div className="bg-red-50 px-6 py-3 rounded-2xl border border-red-100 flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-full text-red-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-xs text-red-400 font-bold uppercase">Toplam Gider</p>
            <p className="text-xl font-bold text-red-700">₺{totalExpense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* TAB MENÜSÜ */}
      <div className="flex justify-between items-center">
        <div className="flex gap-1 bg-white p-1 rounded-xl w-fit border border-gray-100 shadow-sm">
          <button onClick={() => setActiveTab('list')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'}`}>💸 Harcamalar</button>
          <button onClick={() => setActiveTab('categories')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'}`}>🏷️ Kategoriler</button>
        </div>
        
        {activeTab === 'list' && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/30">
            <Plus size={20} /> Gider Ekle
          </button>
        )}
      </div>

      {/* --- TAB 1: GİDER LİSTESİ --- */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          <div className="grid grid-cols-12 gap-4 p-5 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-4">AÇIKLAMA</div>
            <div className="col-span-3">KATEGORİ</div>
            <div className="col-span-3">TARİH</div>
            <div className="col-span-2 text-right">TUTAR</div>
          </div>

          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-red-600" /></div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Wallet size={40} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-[#1B2559]">Harcama Yok</h3>
              <p className="text-gray-500 mt-2">Tebrikler! Henüz gideriniz yok veya sisteme girmediniz.</p>
            </div>
          ) : (
            expenses.map((exp) => (
              <div key={exp.id} className="grid grid-cols-12 gap-4 p-5 border-b border-gray-50 hover:bg-red-50/30 transition-colors items-center group">
                <div className="col-span-4 font-bold text-[#1B2559]">{exp.description}</div>
                <div className="col-span-3">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{exp.expense_categories?.name || 'Genel'}</span>
                </div>
                <div className="col-span-3 text-sm text-gray-500">{new Date(exp.expense_date).toLocaleDateString('tr-TR')}</div>
                <div className="col-span-2 text-right font-bold text-red-600">
                  -₺{exp.amount?.toLocaleString()}
                  <button onClick={() => handleDelete('expenses', exp.id)} className="ml-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- TAB 2: KATEGORİLER --- */}
      {activeTab === 'categories' && (
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 max-w-xl">
          <h3 className="font-bold text-[#1B2559] mb-4 flex items-center gap-2"><Tag size={20}/> Gider Kategorileri</h3>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Örn: Kira, Mutfak, Personel..." 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-red-500/20"
            />
            <button onClick={handleSaveCategory} disabled={saving} className="bg-red-600 text-white px-4 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50">Ekle</button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {categories.map(cat => (
              <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group hover:bg-red-50 transition-colors">
                <span className="font-medium text-gray-700">{cat.name}</span>
                <button onClick={() => handleDelete('expense_categories', cat.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Kategori ekleyerek başlayın.</p>}
          </div>
        </div>
      )}

      {/* --- MODAL: YENİ GİDER --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
            <h2 className="text-2xl font-bold text-[#1B2559] mb-6">Harcama Ekle</h2>
            
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Açıklama</label>
                <input required autoFocus type="text" placeholder="Örn: Ofis Kirası" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-red-500/20 font-bold" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tutar (TL)</label>
                <input required type="number" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-red-500/20 font-mono text-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
                   <select required value={newExpense.category_id} onChange={(e) => setNewExpense({...newExpense, category_id: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-red-500/20">
                     <option value="">Seçiniz</option>
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   {categories.length === 0 && <span className="text-xs text-red-500">Önce kategori ekleyin.</span>}
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Tarih</label>
                   <input required type="date" value={newExpense.expense_date} onChange={(e) => setNewExpense({...newExpense, expense_date: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-red-500/20" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">İptal</button>
                <button disabled={saving} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50">
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}