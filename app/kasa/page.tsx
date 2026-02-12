'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, 
  ArrowUpRight, ArrowDownLeft, Trash2, X, Save 
} from 'lucide-react';

export default function KasaPage() {
  const [hareketler, setHareketler] = useState<any[]>([]);
  const [bakiye, setBakiye] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yeniIslem, setYeniIslem] = useState({
    tip: 'GELİR',
    tutar: 0,
    aciklama: ''
  });

  const fetchKasa = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('kasa_hareketleri').select('*').order('created_at', { ascending: false });
    
    if (data) {
        setHareketler(data);
        const gelir = data.filter(h => h.tip === 'GELİR').reduce((acc, h) => acc + h.tutar, 0);
        const gider = data.filter(h => h.tip === 'GİDER').reduce((acc, h) => acc + h.tutar, 0);
        setBakiye(gelir - gider);
    }
    setLoading(false);
  };

  useEffect(() => { fetchKasa(); }, []);

  const islemEkle = async () => {
    if (yeniIslem.tutar <= 0) return alert("Geçerli bir tutar giriniz!");
    const { error } = await supabase.from('kasa_hareketleri').insert([yeniIslem]);
    if (!error) {
       setIsModalOpen(false);
       setYeniIslem({ tip: 'GELİR', tutar: 0, aciklama: '' });
       fetchKasa();
    } else { alert("Hata: " + error.message); }
  };

  const islemSil = async (id: string) => {
    if (!confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from('kasa_hareketleri').delete().eq('id', id);
    if (!error) fetchKasa();
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-24">
      
      {/* BAŞLIK & BAKİYE KARTI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Sol: Başlık */}
         <div className="lg:col-span-1 flex flex-col justify-center">
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
               KASA & FİNANS <Wallet className="text-emerald-500 animate-pulse" size={28}/>
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">Günlük Nakit Akışı ve Hareketler</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-6 w-fit bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 border border-emerald-400/20 flex items-center gap-2"
            >
               <Plus size={20} strokeWidth={3}/> YENİ İŞLEM EKLE
            </button>
         </div>

         {/* Sağ: Bakiye Göstergesi */}
         <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-700 rounded-[2.5rem] p-8 relative overflow-hidden flex items-center justify-between">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
               <p className="text-emerald-500 font-bold text-xs uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> CANLI BAKİYE
               </p>
               <h2 className={`text-7xl font-black tracking-tighter drop-shadow-2xl ${bakiye < 0 ? 'text-rose-500' : 'text-white'}`}>
                  ₺{bakiye.toLocaleString()}
               </h2>
            </div>
            <div className="hidden md:flex p-6 bg-slate-800/50 rounded-3xl border border-slate-700">
               <TrendingUp size={48} className="text-emerald-400"/>
            </div>
         </div>
      </div>

      {/* İŞLEM LİSTESİ */}
      <div className="space-y-4">
         <h3 className="text-white font-bold text-lg uppercase tracking-wide opacity-80 pl-2">SON HAREKETLER</h3>
         {hareketler.map((islem) => (
            <div key={islem.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-5 rounded-3xl flex items-center justify-between hover:bg-slate-800/60 transition-colors group">
               <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/5
                     ${islem.tip === 'GELİR' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                     {islem.tip === 'GELİR' ? <ArrowUpRight size={24}/> : <ArrowDownLeft size={24}/>}
                  </div>
                  <div>
                     <h4 className="text-white font-bold text-lg">{islem.aciklama || 'Açıklama Yok'}</h4>
                     <p className="text-slate-500 text-xs font-bold uppercase">{new Date(islem.created_at).toLocaleDateString('tr-TR')} • {islem.tip}</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-6">
                  <span className={`text-2xl font-black tracking-tight ${islem.tip === 'GELİR' ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {islem.tip === 'GELİR' ? '+' : '-'}₺{islem.tutar.toLocaleString()}
                  </span>
                  <button onClick={() => islemSil(islem.id)} className="p-3 bg-slate-800 text-slate-500 rounded-xl hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
               </div>
            </div>
         ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 z-50">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-white uppercase tracking-tight">HIZLI İŞLEM EKLE</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                  {/* Gelir / Gider Seçimi */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                     <button 
                       onClick={() => setYeniIslem({...yeniIslem, tip: 'GELİR'})}
                       className={`py-3 rounded-xl font-black text-xs uppercase transition-all ${yeniIslem.tip === 'GELİR' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                     >GELİR (TAHSİLAT)</button>
                     <button 
                       onClick={() => setYeniIslem({...yeniIslem, tip: 'GİDER'})}
                       className={`py-3 rounded-xl font-black text-xs uppercase transition-all ${yeniIslem.tip === 'GİDER' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                     >GİDER (ÖDEME)</button>
                  </div>

                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">TUTAR (TL)</label>
                      <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-black text-lg outline-none focus:border-indigo-500 transition-colors"
                        value={yeniIslem.tutar} onChange={(e) => setYeniIslem({...yeniIslem, tutar: Number(e.target.value)})} />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">AÇIKLAMA</label>
                      <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                        placeholder="Örn: Ofis Kirası" value={yeniIslem.aciklama} onChange={(e) => setYeniIslem({...yeniIslem, aciklama: e.target.value})} />
                  </div>

                 <button onClick={islemEkle} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg shadow-indigo-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
                   <Save size={20} /> İŞLEMİ KAYDET
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}