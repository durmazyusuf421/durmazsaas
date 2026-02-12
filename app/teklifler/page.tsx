'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FileText, Plus, Search, Download, 
  Trash2, CheckCircle, XCircle, Clock, Eye, Filter 
} from 'lucide-react';
import Link from 'next/link';

export default function TekliflerPage() {
  const [teklifler, setTeklifler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Verileri Çek
  const fetchTeklifler = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teklifler')
      .select(`*, cariler ( ad_soyad, unvan )`)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    if (data) setTeklifler(data);
    setLoading(false);
  };

  useEffect(() => { fetchTeklifler(); }, []);

  // Durum Güncelleme
  const durumGuncelle = async (id: string, yeniDurum: string) => {
    const { error } = await supabase.from('teklifler').update({ durum: yeniDurum }).eq('id', id);
    if (!error) {
      setTeklifler(teklifler.map(t => t.id === id ? { ...t, durum: yeniDurum } : t));
    }
  };

  // Teklif Sil
  const teklifSil = async (id: string) => {
    if (!confirm("Bu teklifi silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from('teklifler').delete().eq('id', id);
    if (!error) setTeklifler(teklifler.filter(t => t.id !== id));
  };

  const filteredTeklifler = teklifler.filter(t => 
    (t.cariler?.ad_soyad || t.cariler?.unvan || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-24">
      
      {/* BAŞLIK */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
             TEKLİF YÖNETİMİ <Filter className="text-indigo-500 animate-pulse" size={28}/>
           </h1>
           <p className="text-slate-400 text-sm mt-1 font-medium">Hazırlanan Teklifler ve Durumları</p>
        </div>
        <Link 
          href="/teklif-hazirla" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 border border-indigo-400/20 flex items-center gap-2 transition-all"
        >
           <Plus size={18} strokeWidth={3} /> YENİ TEKLİF OLUŞTUR
        </Link>
      </div>

      {/* ARAMA */}
      <div className="relative group">
         <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
         <div className="relative bg-slate-900/60 backdrop-blur-md border border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <Search className="text-slate-400 group-hover:text-white transition-colors ml-2" size={24}/>
            <input 
              type="text" 
              placeholder="TEKLİF NO, MÜŞTERİ VEYA TUTAR ARA..." 
              className="w-full bg-transparent font-bold text-lg outline-none text-white placeholder-slate-500 uppercase tracking-wide"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* LİSTE */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTeklifler.map((teklif) => (
          <div key={teklif.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-[2rem] hover:border-indigo-500/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group relative overflow-hidden">
             
             {/* Durum Renk Çizgisi */}
             <div className={`absolute left-0 top-0 bottom-0 w-2 
                ${teklif.durum === 'ONAYLANDI' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 
                  teklif.durum === 'REDDEDILDI' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'}`}>
             </div>

             <div className="flex items-center gap-6 pl-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border border-white/5
                  ${teklif.durum === 'ONAYLANDI' ? 'bg-emerald-500/10 text-emerald-400' : 
                    teklif.durum === 'REDDEDILDI' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  <FileText size={28} />
                </div>
                
                <div>
                   <h3 className="font-black text-white text-xl uppercase tracking-wide">
                     {teklif.cariler?.ad_soyad || teklif.cariler?.unvan || 'Bilinmeyen Müşteri'}
                   </h3>
                   <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase border border-slate-700">
                        {new Date(teklif.tarih).toLocaleDateString('tr-TR')}
                      </span>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1 border
                        ${teklif.durum === 'ONAYLANDI' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                          teklif.durum === 'REDDEDILDI' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                        {teklif.durum === 'ONAYLANDI' && <CheckCircle size={10}/>}
                        {teklif.durum === 'REDDEDILDI' && <XCircle size={10}/>}
                        {teklif.durum === 'BEKLEMEDE' && <Clock size={10}/>}
                        {teklif.durum}
                      </span>
                   </div>
                </div>
             </div>

             <div className="text-right flex flex-col items-end">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">TOPLAM TUTAR</p>
                <h4 className="text-3xl font-black text-white tracking-tighter drop-shadow-lg">₺{teklif.genel_toplam?.toLocaleString()}</h4>
             </div>

             {/* İşlemler */}
             <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                {teklif.durum === 'BEKLEMEDE' && (
                  <>
                    <button onClick={() => durumGuncelle(teklif.id, 'ONAYLANDI')} title="Onayla" className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20"><CheckCircle size={20}/></button>
                    <button onClick={() => durumGuncelle(teklif.id, 'REDDEDILDI')} title="Reddet" className="p-3 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20"><XCircle size={20}/></button>
                    <div className="w-px h-8 bg-slate-700 mx-2"></div>
                  </>
                )}
                <button onClick={() => alert('PDF Modülü Yakında!')} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"><Eye size={20}/></button>
                <button onClick={() => teklifSil(teklif.id)} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 size={20}/></button>
             </div>
          </div>
        ))}
        {filteredTeklifler.length === 0 && !loading && (
           <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-[2rem]">
              <p className="text-slate-500 font-bold uppercase">Henüz teklif bulunamadı.</p>
           </div>
        )}
      </div>
    </div>
  );
}