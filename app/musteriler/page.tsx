'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; 
import { 
  Users, Search, Plus, Phone, MapPin, 
  Trash2, Save, XCircle, Building2, Edit, CreditCard 
} from 'lucide-react';

interface Cari {
  id: string;
  created_at: string;
  ad_soyad: string;
  unvan: string;
  telefon: string;
  adres: string;
  bakiye: number;
}

export default function MusterilerPage() {
  const [loading, setLoading] = useState(true);
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    ad_soyad: '',
    unvan: '',
    telefon: '',
    adres: ''
  });

  const fetchCariler = async () => {
    setLoading(true);
    const { data } = await supabase.from('cariler').select('*').order('ad_soyad', { ascending: true });
    if (data) setCariler(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchCariler(); }, []);

  const openModal = (cari?: Cari) => {
    if (cari) {
      setEditingId(cari.id);
      setFormData({
        ad_soyad: cari.ad_soyad || '',
        unvan: cari.unvan || '',
        telefon: cari.telefon || '',
        adres: cari.adres || ''
      });
    } else {
      setEditingId(null);
      setFormData({ ad_soyad: '', unvan: '', telefon: '', adres: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ad_soyad) return alert('Lütfen isim giriniz.');
    try {
      if (editingId) {
        const { error } = await supabase.from('cariler').update(formData).eq('id', editingId);
        if (error) throw error;
        alert('Güncellendi! ✅');
      } else {
        const { error } = await supabase.from('cariler').insert([{ ...formData, bakiye: 0 }]);
        if (error) throw error;
        alert('Kaydedildi! 🎉');
      }
      setShowModal(false);
      fetchCariler();
    } catch (error: any) { alert('Hata: ' + error.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('DİKKAT: Bu müşteriyi silmek istediğine emin misin?')) return;
    try {
      const { error } = await supabase.from('cariler').delete().eq('id', id);
      if (error) alert('Hata: Bu müşterinin işlemleri (Teklif/Kasa) var, silemezsin.');
      else fetchCariler();
    } catch (error: any) { alert('Hata: ' + error.message); }
  };

  const filteredCariler = cariler.filter(c => 
    (c.ad_soyad || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.unvan || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 py-8 px-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200"><Users size={28} /></div>
          <div><h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Müşteri Defteri</h1><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Durmazsaas CRM</p></div>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input type="text" placeholder="MÜŞTERİ VEYA ÜNVAN ARA..." className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-700 outline-none border-2 border-transparent focus:border-indigo-100 focus:bg-white transition-all uppercase" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={() => openModal()} className="bg-[#0f172a] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 hover:scale-105 transition-all flex items-center justify-center gap-2 whitespace-nowrap"><Plus size={18} /> YENİ EKLE</button>
        </div>
      </div>

      {/* LİSTE */}
      <div className="space-y-3">
        {filteredCariler.length === 0 && <div className="text-center py-20 text-slate-400 font-bold uppercase">Kayıt Bulunamadı</div>}
        
        {filteredCariler.map(cari => (
          <div key={cari.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all group flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-4 w-full md:w-[40%]">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-lg shadow-sm">{(cari.ad_soyad || '?').charAt(0)}</div>
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase leading-tight">{cari.ad_soyad || 'İsimsiz'}</h3>
                {cari.unvan && <div className="flex items-center gap-1 text-slate-400"><Building2 size={12} /><p className="text-[10px] font-bold uppercase tracking-wide truncate">{cari.unvan}</p></div>}
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full md:w-[30%] border-l border-slate-100 pl-4 md:border-none md:pl-0">
               <div className="flex items-center gap-2 text-slate-500"><Phone size={14} className="text-slate-300"/><p className="text-xs font-bold font-mono">{cari.telefon || '---'}</p></div>
               <div className="flex items-center gap-2 text-slate-500"><MapPin size={14} className="text-slate-300"/><p className="text-[10px] font-bold uppercase truncate max-w-[200px]">{cari.adres || '---'}</p></div>
            </div>

            <div className="flex items-center justify-between w-full md:w-[30%] bg-slate-50 p-2 rounded-xl">
               <div className="px-3">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">BAKİYE</p>
                 <p className={`text-lg font-black tracking-tighter ${cari.bakiye > 0 ? 'text-rose-600' : (cari.bakiye < 0 ? 'text-emerald-600' : 'text-slate-600')}`}>₺{Number(cari.bakiye).toLocaleString('tr-TR')}</p>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={() => openModal(cari)} className="w-10 h-10 bg-white text-indigo-500 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-slate-200" title="Düzenle"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(cari.id)} className="w-10 h-10 bg-white text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-slate-200" title="Sil"><Trash2 size={16} /></button>
               </div>
            </div>

          </div>
        ))}
      </div>

      {/* MODAL (DÜZELTİLDİ: ARTIK BUTON SABİT) */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          {/* max-h-[90vh] ve flex-col ekledim, taşmayı engeller */}
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* ÜST: BAŞLIK (SABİT) */}
            <div className="flex justify-between items-center p-8 border-b border-slate-100">
              <div><h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{editingId ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Lütfen bilgileri eksiksiz giriniz</p></div>
              <button onClick={() => setShowModal(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"><XCircle size={24} /></button>
            </div>
            
            {/* ORTA: FORM (KAYDIRILABİLİR) */}
            <div className="p-8 overflow-y-auto">
              <form id="cariForm" onSubmit={handleSave} className="space-y-5">
                <div className="space-y-4">
                  <div className="group"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Ad Soyad</label><input type="text" autoFocus value={formData.ad_soyad} onChange={e => setFormData({...formData, ad_soyad: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm text-slate-800 outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all uppercase" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Ünvan</label><input type="text" value={formData.unvan} onChange={e => setFormData({...formData, unvan: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm text-slate-800 outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all uppercase" /></div>
                    <div className="group"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Telefon</label><input type="text" value={formData.telefon} onChange={e => setFormData({...formData, telefon: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm text-slate-800 outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all uppercase" /></div>
                  </div>
                  <div className="group"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Adres</label><textarea rows={3} value={formData.adres} onChange={e => setFormData({...formData, adres: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm text-slate-800 outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all uppercase resize-none" /></div>
                </div>
              </form>
            </div>

            {/* ALT: BUTON (SABİT) */}
            <div className="p-8 border-t border-slate-100 bg-slate-50 rounded-b-[2.5rem]">
               <button 
                 type="submit" 
                 form="cariForm" 
                 className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                 <Save size={18} /> {editingId ? 'GÜNCELLE' : 'KAYDET'}
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}