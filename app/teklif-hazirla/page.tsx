'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FileText, User, Plus, Trash2, Save, 
  Calculator, Calendar, Package, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeklifHazirlaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cariler, setCariler] = useState<any[]>([]);
  const [stoklar, setStoklar] = useState<any[]>([]);
  
  const [secilenCari, setSecilenCari] = useState('');
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [aciklama, setAciklama] = useState('');
  
  const [kalemler, setKalemler] = useState<any[]>([
    { urun_id: '', urun_adi: '', miktar: 1, birim_fiyat: 0, toplam: 0 }
  ]);

  const araToplam = kalemler.reduce((acc,item) => acc + (item.miktar * item.birim_fiyat), 0);
  const kdvTutari = araToplam * 0.20;
  const genelToplam = araToplam + kdvTutari;

  useEffect(() => {
    const fetchData = async () => {
      const { data: c } = await supabase.from('cariler').select('id, ad_soyad, unvan');
      const { data: s } = await supabase.from('urunler').select('id, ad, satis');
      if (c) setCariler(c);
      if (s) setStoklar(s);
    };
    fetchData();
  }, []);

  const satirEkle = () => setKalemler([...kalemler, { urun_id: '', urun_adi: '', miktar: 1, birim_fiyat: 0, toplam: 0 }]);
  
  const satirSil = (index: number) => {
    if (kalemler.length === 1) return;
    const yeni = [...kalemler];
    yeni.splice(index, 1);
    setKalemler(yeni);
  };

  const satirGuncelle = (index: number, alan: string, deger: any) => {
    const yeni = [...kalemler];
    if (alan === 'urun_id') {
      const urun = stoklar.find(s => s.id === deger);
      yeni[index].urun_id = deger;
      yeni[index].urun_adi = urun?.ad || '';
      yeni[index].birim_fiyat = urun?.satis || 0;
    } else {
      yeni[index][alan] = deger;
    }
    yeni[index].toplam = yeni[index].miktar * yeni[index].birim_fiyat;
    setKalemler(yeni);
  };

  const teklifiKaydet = async () => {
    if (!secilenCari) return alert("Müşteri seçmediniz!");
    setLoading(true);

    const { data: teklifData, error: tErr } = await supabase.from('teklifler').insert([{
        cari_id: secilenCari, tarih, toplam_fiyat: araToplam, kdv_orani: 20,
        kdv_tutari: kdvTutari, genel_toplam: genelToplam, aciklama
      }]).select().single();

    if (!tErr) {
      const kalemVerileri = kalemler.map(k => ({
        teklif_id: teklifData.id, urun_id: k.urun_id || null, urun_adi: k.urun_adi,
        miktar: k.miktar, birim_fiyat: k.birim_fiyat, toplam: k.toplam
      }));
      await supabase.from('teklif_kalemleri').insert(kalemVerileri);
      router.push('/teklifler');
    } else {
      alert("Hata: " + tErr.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-32">
      
      {/* BAŞLIK */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Link href="/teklifler" className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 text-slate-300 transition-colors">
               <ArrowLeft size={20}/>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">YENİ TEKLİF OLUŞTUR</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">HESAPLAMA MOTORU</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL: FORM */}
        <div className="lg:col-span-2 space-y-6">
           {/* Müşteri Seçimi */}
           <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-2 block">MÜŞTERİ SEÇİN</label>
                    <select 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-bold text-sm text-white outline-none focus:border-indigo-500 transition-colors uppercase"
                        value={secilenCari}
                        onChange={(e) => setSecilenCari(e.target.value)}
                      >
                        <option value="">-- Müşteri Seçiniz --</option>
                        {cariler.map(c => <option key={c.id} value={c.id}>{c.unvan || c.ad_soyad}</option>)}
                      </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-2 block">TARİH</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-bold text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                      value={tarih}
                      onChange={(e) => setTarih(e.target.value)}
                    />
                 </div>
              </div>
              <div className="mt-4">
                 <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-2 block">AÇIKLAMA</label>
                 <textarea 
                   rows={2}
                   className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-bold text-sm text-white outline-none focus:border-indigo-500 transition-colors placeholder-slate-700"
                   placeholder="Proje detayları..."
                   value={aciklama}
                   onChange={(e) => setAciklama(e.target.value)}
                 />
              </div>
           </div>

           {/* Ürünler */}
           <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem]">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-white text-lg uppercase flex items-center gap-2"><Package size={20} className="text-indigo-500"/> ÜRÜNLER</h3>
                 <button onClick={satirEkle} className="text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-lg hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1">
                    <Plus size={14}/> SATIR EKLE
                 </button>
              </div>

              <div className="space-y-3">
                 {kalemler.map((kalem, index) => (
                   <div key={index} className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800 group hover:border-indigo-500/30 transition-colors">
                      <div className="flex-1 w-full">
                         <select 
                           className="w-full bg-transparent border-b border-slate-800 p-2 text-xs font-bold text-white outline-none focus:border-indigo-500 uppercase mb-1"
                           value={kalem.urun_id}
                           onChange={(e) => satirGuncelle(index, 'urun_id', e.target.value)}
                         >
                           <option value="">-- Ürün Seç --</option>
                           {stoklar.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                         </select>
                         <input 
                           type="text" 
                           className="w-full bg-transparent text-xs font-bold text-slate-500 outline-none placeholder-slate-600"
                           placeholder="Veya ürün adını buraya yaz..."
                           value={kalem.urun_adi}
                           onChange={(e) => satirGuncelle(index, 'urun_adi', e.target.value)}
                         />
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-auto">
                         <input type="number" className="w-20 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-xs font-bold text-white outline-none focus:border-indigo-500" placeholder="Adet" value={kalem.miktar} onChange={(e) => satirGuncelle(index, 'miktar', Number(e.target.value))}/>
                         <input type="number" className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-xs font-bold text-white outline-none focus:border-indigo-500" placeholder="Fiyat" value={kalem.birim_fiyat} onChange={(e) => satirGuncelle(index, 'birim_fiyat', Number(e.target.value))}/>
                         <div className="w-24 text-right pr-2"><span className="text-sm font-black text-white">₺{kalem.toplam.toLocaleString()}</span></div>
                         <button onClick={() => satirSil(index)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* SAĞ: ÖZET FİŞİ */}
        <div className="lg:col-span-1">
           <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] sticky top-6 shadow-2xl">
              <h3 className="font-bold text-slate-500 text-xs uppercase tracking-widest mb-6 pb-2 border-b border-slate-800">ÖDEME ÖZETİ</h3>
              <div className="space-y-4 mb-8">
                 <div className="flex justify-between items-center text-slate-400"><span className="text-sm font-bold">ARA TOPLAM</span><span className="text-xl font-bold text-white">₺{araToplam.toLocaleString()}</span></div>
                 <div className="flex justify-between items-center text-emerald-400"><span className="text-sm font-bold opacity-80">KDV (%20)</span><span className="text-xl font-bold">+₺{kdvTutari.toLocaleString()}</span></div>
                 <div className="pt-4 border-t border-slate-800 flex justify-between items-center"><span className="text-base font-black text-white tracking-wider">GENEL TOPLAM</span><span className="text-3xl font-black text-indigo-400 tracking-tighter">₺{genelToplam.toLocaleString()}</span></div>
              </div>
              <button onClick={teklifiKaydet} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2">
                {loading ? 'KAYDEDİLİYOR...' : <><Save size={20}/> TEKLİFİ OLUŞTUR</>}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}