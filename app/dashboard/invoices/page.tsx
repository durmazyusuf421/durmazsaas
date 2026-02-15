'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FileText, Wallet, Loader2, Search, ArrowDownRight, ArrowUpRight, ArrowRightLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AllInvoicesPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAllTransactions = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
        if (!profile?.company_id) return;

        // 1. Tüm Faturaları Çek (Müşteri bilgileriyle beraber)
        const { data: invData } = await supabase
          .from('invoices')
          .select('*, customers(name, current_cari_code)')
          .eq('company_id', profile.company_id);

        // 2. Tüm Tahsilatları Çek (Müşteri bilgileriyle beraber)
        const { data: payData } = await supabase
          .from('payments')
          .select('*, customers(name, current_cari_code)')
          .eq('company_id', profile.company_id);

        // 3. İkisini Birleştir ve Tarihe Göre Sırala
        let allTx: any[] = [];
        if (invData) allTx = [...allTx, ...invData.map(i => ({ ...i, type: 'invoice', date: i.created_at }))];
        if (payData) allTx = [...allTx, ...payData.map(p => ({ ...p, type: 'payment', date: p.created_at }))];
        
        allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(allTx);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, []);

  // Arama Filtresi (Müşteri adına veya Cari Koda göre)
  const filteredTransactions = transactions.filter(t => 
    t.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customers?.current_cari_code?.includes(searchTerm)
  );

  // Toplam İstatistikler
  const totalInvoiced = transactions.filter(t => t.type === 'invoice').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalCollected = transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="p-4 md:p-8 space-y-6 text-[#1B2559]">
      
      {/* BAŞLIK */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Genel Kasa Defteri</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">Tüm müşterilere kesilen faturalar ve alınan ödemeler.</p>
        </div>
      </div>

      {/* ÖZET KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-100 p-6 rounded-[24px] flex items-center gap-4">
          <div className="w-14 h-14 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
            <ArrowUpRight size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Kesilen Toplam Fatura (Alacak)</p>
            <h3 className="text-3xl font-black text-red-600 tracking-tighter">₺{totalInvoiced.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-100 p-6 rounded-[24px] flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            <ArrowDownRight size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Alınan Toplam Tahsilat (Giren)</p>
            <h3 className="text-3xl font-black text-green-700 tracking-tighter">₺{totalCollected.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* ARAMA ÇUBUĞU */}
      <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-3">
        <Search className="text-gray-400 ml-2" size={20} />
        <input 
          type="text" 
          placeholder="Müşteri Adı veya Cari Kod ile ara..." 
          className="w-full bg-transparent border-none outline-none font-medium text-[#1B2559]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TÜM HAREKETLER TABLOSU */}
      <div className="bg-white border border-gray-100 rounded-[30px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-gray-50/50 border-b border-gray-50">
              <tr>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Tarih</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Müşteri / Cari</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">İşlem Türü</th>
                <th className="p-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Tutar</th>
                <th className="p-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Git</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[#3063E9]" size={32}/></td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <ArrowRightLeft size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-medium">Herhangi bir hareket bulunamadı.</p>
                  </td>
                </tr>
              ) : filteredTransactions.map((t, idx) => (
                <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                  {/* TARİH */}
                  <td className="p-5 font-bold text-gray-500 text-sm">
                    {new Date(t.date).toLocaleDateString('tr-TR')} <span className="text-xs font-medium text-gray-400 block">{new Date(t.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' })}</span>
                  </td>
                  
                  {/* MÜŞTERİ */}
                  <td className="p-5">
                    <p className="font-black text-[#1B2559] uppercase">{t.customers?.name || 'Bilinmeyen Müşteri'}</p>
                    <p className="text-xs text-gray-400 font-bold tracking-widest mt-1">Cari Kod: {t.customers?.current_cari_code || '-'}</p>
                  </td>

                  {/* İŞLEM TÜRÜ */}
                  <td className="p-5">
                    {t.type === 'invoice' ? (
                      <div className="flex items-center gap-2 text-red-500 bg-red-50 w-fit px-3 py-1.5 rounded-lg border border-red-100">
                        <FileText size={16}/> <span className="font-bold text-xs uppercase tracking-widest">Satış Faturası</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 w-fit px-3 py-1.5 rounded-lg border border-green-100">
                        <Wallet size={16}/> <span className="font-bold text-xs uppercase tracking-widest">Tahsilat ({t.payment_method})</span>
                      </div>
                    )}
                  </td>

                  {/* TUTAR */}
                  <td className="p-5 text-right font-black text-lg tracking-tight">
                    {t.type === 'invoice' ? (
                      <span className="text-red-500">+ ₺{Number(t.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    ) : (
                      <span className="text-green-600">- ₺{Number(t.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    )}
                  </td>

                  {/* MÜŞTERİYE GİT BUTONU */}
                  <td className="p-5 text-center">
                    <button 
                      onClick={() => router.push(`/dashboard/customers/${t.customer_id}`)}
                      className="text-xs font-bold text-[#3063E9] bg-blue-50 hover:bg-[#3063E9] hover:text-white px-4 py-2 rounded-xl transition-colors"
                    >
                      Müşteriyi Aç
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}