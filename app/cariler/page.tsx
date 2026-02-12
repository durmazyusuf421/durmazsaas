'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Phone, Mail, Trash2, X, Wallet, ChevronRight } from 'lucide-react';

export default function CarilerPage() {
  const router = useRouter();
  const [cariler, setCariler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'customer',
    email: '',
    phone: '',
    tax_office: '',
    tax_number: ''
  });

  useEffect(() => {
    fetchCariler();
  }, []);

  async function fetchCariler() {
    setLoading(true);
    
    // 1. Carileri, Faturaları ve Ödemeleri TEK SEFERDE çekiyoruz (Relational Query)
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        invoices ( type, total_amount ),
        payments ( type, amount )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // 2. Her carinin bakiyesini hesapla
    const carilerWithBalance = data?.map((cari: any) => {
      let balance = 0;

      // Faturaları Topla
      cari.invoices?.forEach((inv: any) => {
        if (inv.type === 'sales') balance += Number(inv.total_amount); // Satış (+ Alacak)
        if (inv.type === 'purchase') balance -= Number(inv.total_amount); // Alış (- Borç)
      });

      // Ödemeleri Çıkar/Ekle
      cari.payments?.forEach((pay: any) => {
        if (pay.type === 'in') balance -= Number(pay.amount); // Tahsilat (Borçtan düş)
        if (pay.type === 'out') balance += Number(pay.amount); // Ödeme (Bizim borcumuzdan düş)
      });

      return { ...cari, balance };
    });

    setCariler(carilerWithBalance || []);
    setLoading(false);
  }

  async function handleAddCari(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) return;

      const { error } = await supabase
        .from('contacts')
        .insert([{ ...formData, company_id: profile.company_id }]);

      if (error) throw error;

      setIsModalOpen(false);
      setFormData({ name: '', type: 'customer', email: '', phone: '', tax_office: '', tax_number: '' });
      fetchCariler(); // Listeyi yenile
      alert("Cari eklendi! ✅");

    } catch (error: any) {
      alert("Hata: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 ml-64 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Cari Kartlar</h1>
          <p className="text-slate-500 text-sm mt-1">Müşteri bakiyelerini ve iletişim bilgilerini yönetin.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus size={20} /> Yeni Cari Oluştur
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Ünvan / İsim</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Kategori</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Güncel Bakiye</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Detay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Hesaplar kontrol ediliyor...</td></tr>
            ) : cariler.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Kayıt yok.</td></tr>
            ) : cariler.map((cari) => (
              <tr 
                key={cari.id} 
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group"
                onClick={() => router.push(`/cariler/${cari.id}`)}
              >
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 dark:text-white capitalize text-lg">{cari.name}</p>
                  <div className="flex flex-col gap-0.5 mt-1 text-xs text-slate-500">
                    {cari.phone && <span className="flex items-center gap-1"><Phone size={12}/> {cari.phone}</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${
                    cari.type === 'customer' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {cari.type === 'customer' ? 'Müşteri' : 'Tedarikçi'}
                  </span>
                </td>
                
                {/* BAKİYE SÜTUNU (En Önemli Yer) */}
                <td className="px-6 py-4 text-right">
                  <div className={`text-lg font-black ${cari.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {cari.balance.toLocaleString('tr-TR')} ₺
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">
                     {cari.balance === 0 ? '-' : (cari.balance > 0 ? 'Alacaklısınız' : 'Borçlusunuz')}
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <button className="text-slate-300 group-hover:text-blue-600 transition-colors">
                    <ChevronRight size={24} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Kısmı (Aynı) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-200">
             <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold">Yeni Cari</h2>
                <button onClick={() => setIsModalOpen(false)}><X/></button>
             </div>
             <form onSubmit={handleAddCari} className="space-y-4">
                <input className="w-full p-4 border rounded-xl" placeholder="Ad Soyad" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required/>
                <select className="w-full p-4 border rounded-xl" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="customer">Müşteri</option>
                    <option value="vendor">Tedarikçi</option>
                </select>
                <input className="w-full p-4 border rounded-xl" placeholder="Telefon" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/>
                <button disabled={submitting} type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold">KAYDET</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}