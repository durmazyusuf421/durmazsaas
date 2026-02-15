'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, Search, Loader2, CheckCircle2, X } from 'lucide-react';

export default function BusinessCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 🔄 MÜŞTERİLERİ GETİR (useCallback ile optimize edildi)
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false });

        if (data) setCustomers(data);
      }
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // 🔍 GLOBAL KOD İLE MÜŞTERİ ARA
  const handleGlobalSearch = async () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    setFoundCustomer(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('global_cari_code', searchCode.trim().toUpperCase())
        .single();

      if (error || !data) throw new Error("Müşteri bulunamadı");
      
      setFoundCustomer(data);
    } catch (err) {
      alert("Bu kodla eşleşen bir müşteri bulunamadı! Kodu kontrol edin.");
    } finally {
      setSearching(false);
    }
  };

  // ✅ BULDUN VE DÜKKANA EKLE
  const addGlobalCustomer = async () => {
    if (!foundCustomer) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error("İşletme hesabı bulunamadı");

      const { error } = await supabase.from('customers').insert([{
        company_id: profile.company_id,
        name: foundCustomer.full_name || 'İsimsiz',
        email: foundCustomer.email || '',
        phone: foundCustomer.phone || '',
        address: foundCustomer.billing_address || '',
        tax_no: foundCustomer.tax_no || '',
        tax_office: foundCustomer.tax_office || '',
        current_cari_code: foundCustomer.global_cari_code
      }]);

      if (error) throw error;

      alert("Müşteri başarıyla dükkanınıza bağlandı!");
      setIsModalOpen(false);
      setFoundCustomer(null);
      setSearchCode('');
      fetchCustomers(); // Listeyi yenile
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-[#1B2559]">Müşteri Portföyü</h1>
          <p className="text-gray-400 font-medium text-sm">Global ağdan müşteri çekebilir veya manuel ekleyebilirsiniz.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#3063E9] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          <Plus size={20} /> Müşteri Ekle
        </button>
      </div>

      {/* MÜŞTERİ LİSTESİ */}
      <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-50">
              <tr>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase">Cari Kod / Müşteri</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase">Vergi No</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={3} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={3} className="p-10 text-center text-gray-400 font-medium">Henüz kayıtlı müşteri yok.</td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5">
                    <div className="font-black text-[#1B2559] uppercase">{c.name}</div>
                    <div className="text-xs text-blue-500 font-bold tracking-widest mt-1">{c.current_cari_code}</div>
                  </td>
                  <td className="p-5 font-bold text-gray-500">{c.tax_no || '---'}</td>
                  <td className="p-5 text-right">
                    <button className="text-[#3063E9] font-black text-xs uppercase hover:underline">Detaylar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🟢 MÜŞTERİ EKLEME MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setIsModalOpen(false); setFoundCustomer(null); setSearchCode(''); }} 
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 bg-gray-50 p-2 rounded-xl"
            >
              <X size={20}/>
            </button>
            
            <h2 className="text-2xl font-black text-[#1B2559] uppercase tracking-tighter mb-6">Global Kodla Getir</h2>
            
            <div className="space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="CARI-XXXX"
                  className="flex-1 p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-[#3063E9] font-black text-[#1B2559] uppercase tracking-widest"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                />
                <button 
                  onClick={handleGlobalSearch}
                  disabled={searching}
                  className="bg-[#1B2559] text-white px-6 rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                >
                  {searching ? <Loader2 className="animate-spin" /> : <Search size={24} />}
                </button>
              </div>

              {foundCustomer && (
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#3063E9] text-white rounded-xl flex items-center justify-center font-black shrink-0">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-[#1B2559] uppercase">{foundCustomer.full_name}</h4>
                      <p className="text-xs font-bold text-blue-600 tracking-widest">{foundCustomer.global_cari_code}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-2xl">
                    <div><p className="text-gray-400 font-bold uppercase mb-1">Vergi No</p><p className="font-black text-[#1B2559]">{foundCustomer.tax_no || '-'}</p></div>
                    <div><p className="text-gray-400 font-bold uppercase mb-1">Vergi Dairesi</p><p className="font-black text-[#1B2559]">{foundCustomer.tax_office || '-'}</p></div>
                  </div>
                  <button 
                    onClick={addGlobalCustomer}
                    className="w-full py-4 bg-[#3063E9] hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 transition-all active:scale-95"
                  >
                    Dükkanıma Bağla
                  </button>
                </div>
              )}

              {!foundCustomer && !searching && (
                <p className="text-center text-gray-400 text-sm font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  Müşterinizden aldığı CARI kodunu isteyin ve buraya yazın. Tüm bilgileri otomatik çekilecektir.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}