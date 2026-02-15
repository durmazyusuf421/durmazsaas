'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Key, Loader2, BadgeCheck, Plus, X, Clock, CheckCircle2, Edit, Eye } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState({ id: '', name: '', phone: '' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) return;

      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      const { data: connectionsData } = await supabase
        .from('customer_connections')
        .select('cari_code, status')
        .eq('company_id', profile.company_id);
      
      if (customersData) {
        const mergedCustomers = customersData.map(cust => {
          const conn = connectionsData?.find(c => c.cari_code === cust.current_cari_code);
          return { ...cust, connection_status: conn?.status || null };
        });
        setCustomers(mergedCustomers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddCustomer = async () => {
    if (!newCustomer.name) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single();

      const { error } = await supabase.from('customers').insert([{
        name: newCustomer.name,
        phone: newCustomer.phone,
        company_id: profile?.company_id
      }]);

      if (!error) {
        setIsModalOpen(false);
        setNewCustomer({ name: '', phone: '' });
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateCustomer = async () => {
    if (!editCustomer.name) return alert("Ad alanı boş bırakılamaz!");
    try {
      const { error } = await supabase.from('customers').update({ name: editCustomer.name, phone: editCustomer.phone }).eq('id', editCustomer.id);
      if (!error) {
        setIsEditModalOpen(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleAssignCode = async (customer: any) => {
    if (customer.current_cari_code) return;
    setProcessingId(customer.id);
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const { error } = await supabase.from('customers').update({ current_cari_code: newCode }).eq('id', customer.id);
      if (!error) fetchData();
    } catch (err) { console.error(err); } finally { setProcessingId(null); }
  };

  const handleApprove = async (cariCode: string) => {
    try {
      const { error } = await supabase.from('customer_connections').update({ status: 'onayli' }).eq('cari_code', cariCode);
      if (!error) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (cariCode: string) => {
    if (!confirm("Bu isteği reddetmek istiyor musunuz?")) return;
    try {
      const { error } = await supabase.from('customer_connections').delete().eq('cari_code', cariCode);
      if (!error) fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-[#1B2559]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Müşteriler & Cari Kodlar</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all">
          <Plus size={20} /> Yeni Müşteri
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[30px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-50">
              <tr>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Müşteri & Durum</th>
                <th className="p-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Cari Kod</th>
                <th className="p-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={32}/></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={3} className="p-20 text-center text-gray-400 font-medium">Henüz müşteri eklemediniz.</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-[#1B2559] text-base">{c.name}</div>
                    <div className="mt-1">
                      {c.connection_status === 'onayli' ? (
                        <span className="text-[10px] text-green-600 font-bold flex items-center gap-1 uppercase tracking-tighter bg-green-50 w-max px-2 py-0.5 rounded-md"><CheckCircle2 size={12} /> Dükkana Bağlı</span>
                      ) : c.connection_status === 'onay_bekliyor' ? (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 uppercase tracking-tighter bg-amber-50 w-max px-2 py-0.5 rounded-md"><Clock size={12} /> Onay Bekliyor</span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{c.phone || 'Telefon Yok'}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    {c.current_cari_code ? (
                      <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-xl font-black tracking-widest border border-green-100 text-sm italic">{c.current_cari_code}</span>
                    ) : (
                      <span className="text-gray-200 text-[10px] font-bold uppercase tracking-widest italic">Kod Yok</span>
                    )}
                  </td>
                  
                  <td className="p-5 text-right flex items-center justify-end gap-2">
                    
                    {/* 🌟 YENİ EKLENEN KASAYA GİT BUTONU */}
                    <Link 
                      href={`/dashboard/customers/${c.id}`}
                      className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors flex items-center gap-1 shadow-sm font-bold text-xs"
                      title="Kasaya Git / Ekstre"
                    >
                      <Eye size={16} /> <span className="hidden md:inline">Kasa</span>
                    </Link>

                    {/* DÜZENLE BUTONU */}
                    <button 
                      onClick={() => {
                        setEditCustomer({ id: c.id, name: c.name, phone: c.phone || '' });
                        setIsEditModalOpen(true);
                      }}
                      className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Müşteriyi Düzenle"
                    >
                      <Edit size={18} />
                    </button>

                    {/* ONAYLAR VE KOD ÜRET */}
                    {c.connection_status === 'onay_bekliyor' ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleApprove(c.current_cari_code)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Onayla</button>
                        <button onClick={() => handleReject(c.current_cari_code)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-2 py-2 rounded-xl text-xs font-bold"><X size={14}/></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleAssignCode(c)}
                        disabled={processingId === c.id || !!c.current_cari_code}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          c.current_cari_code ? "bg-gray-50 text-gray-400 cursor-default hidden md:block" : "bg-blue-600 text-white shadow-lg shadow-blue-100 hover:scale-105 active:scale-95"
                        }`}
                      >
                        {c.current_cari_code ? <span className="flex items-center gap-1"><BadgeCheck size={16} /> Aktif</span> : "Kod Üret"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* YENİ MÜŞTERİ MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#1B2559]">Müşteri Ekle</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Müşteri Adı" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-500 font-medium" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
              <input placeholder="Telefon" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-500 font-medium" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 p-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl">Vazgeç</button>
                <button onClick={handleAddCustomer} className="flex-1 p-4 bg-[#3063E9] text-white rounded-2xl font-bold shadow-lg shadow-blue-200">Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DÜZENLEME MODALI */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#1B2559]">Müşteriyi Düzenle</h2>
              <button onClick={() => setIsEditModalOpen(false)}><X className="text-gray-400 hover:text-red-500 transition-colors" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Müşteri Adı</label>
                <input placeholder="Müşteri Adı" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-500 font-medium" value={editCustomer.name} onChange={e => setEditCustomer({...editCustomer, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Telefon</label>
                <input placeholder="Telefon Numarası" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-blue-500 font-medium" value={editCustomer.phone} onChange={e => setEditCustomer({...editCustomer, phone: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 p-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl">İptal</button>
                <button onClick={handleUpdateCustomer} className="flex-1 p-4 bg-[#3063E9] text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95">Güncelle</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}