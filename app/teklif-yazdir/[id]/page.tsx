'use client';

import React, { useEffect, useState } from 'react';
// DÜZELTME BURADA: 2 nokta (../) yerine 3 nokta vardı, şimdi düzelttim.
// Eğer hala hata verirse, "../../../lib/supabase" veya "@/lib/supabase" deneyebiliriz.
import { supabase } from '../../lib/supabase'; 
import { useParams } from 'next/navigation';
import { Printer, Phone, Mail, MapPin, Hexagon } from 'lucide-react';

export default function TeklifYazdirPage() {
  const params = useParams();
  const id = params?.id;

  const [teklif, setTeklif] = useState<any>(null);
  const [satirlar, setSatirlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      const { data: tData, error: tError } = await supabase
        .from('teklifler')
        .select('*, cariler(*)')
        .eq('id', id)
        .single();
      
      const { data: sData, error: sError } = await supabase
        .from('teklif_satirlari')
        .select('*')
        .eq('teklif_id', id);

      if (tError) console.error("Teklif Hatası:", tError);
      if (sError) console.error("Satır Hatası:", sError);

      if (tData) setTeklif(tData);
      if (sData) setSatirlar(sData);
      setLoading(false);
    };
    
    fetchData();
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center text-xl font-bold text-slate-500">TEKLİF HAZIRLANIYOR...</div>;
  
  if (!teklif) return (
    <div className="flex flex-col h-screen items-center justify-center gap-4">
      <div className="text-xl font-bold text-red-500">TEKLİF BULUNAMADI!</div>
      <p className="text-slate-400">Aranan ID: {id}</p>
      <button onClick={() => window.close()} className="bg-slate-200 px-4 py-2 rounded">Pencereyi Kapat</button>
    </div>
  );

  return (
    <div className="bg-slate-100 min-h-screen p-8 flex flex-col items-center">
      
      {/* YAZDIR BUTONU */}
      <div className="w-[21cm] flex justify-end mb-6 print:hidden">
        <button 
          onClick={() => window.print()}
          className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 shadow-xl transition-all active:scale-95 cursor-pointer"
        >
          <Printer size={20} /> YAZDIR / PDF KAYDET
        </button>
      </div>

      {/* A4 KAĞIT ALANI */}
      <div className="bg-white w-[21cm] min-h-[29.7cm] p-12 shadow-2xl print:shadow-none print:w-full print:p-0 text-slate-800 relative overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
               <Hexagon size={40} className="text-slate-900 fill-slate-900"/>
               <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">DURMAZSAAS</h1>
            </div>
            <p className="text-xs font-bold text-slate-500 tracking-[0.2em] uppercase">YAZILIM VE TEKNOLOJİ HİZMETLERİ</p>
            <div className="mt-6 space-y-1.5 text-[10px] font-bold text-slate-400 uppercase">
               <p className="flex items-center gap-2"><MapPin size={12}/> KONYA TEKNOKENT / TÜRKİYE</p>
               <p className="flex items-center gap-2"><Phone size={12}/> +90 555 000 00 00</p>
               <p className="flex items-center gap-2"><Mail size={12}/> info@durmazsaas.com</p>
            </div>
          </div>
          
          <div className="text-right">
             <h2 className="text-5xl font-black text-slate-100 uppercase tracking-tighter mb-2">TEKLİF</h2>
             <div className="space-y-1">
               <p className="text-xs font-bold text-slate-500 uppercase">NO: <span className="text-slate-900">#{teklif.id.slice(0, 8).toUpperCase()}</span></p>
               <p className="text-xs font-bold text-slate-500 uppercase">TARİH: <span className="text-slate-900">{new Date(teklif.created_at).toLocaleDateString('tr-TR')}</span></p>
               <p className="text-xs font-bold text-slate-500 uppercase">GEÇERLİLİK: <span className="text-slate-900">{new Date(teklif.bitis_tarihi).toLocaleDateString('tr-TR')}</span></p>
             </div>
          </div>
        </div>

        {/* MÜŞTERİ */}
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 mb-10">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SAYIN / FİRMA</p>
           <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{teklif.cariler?.unvan || teklif.cariler?.ad_soyad}</h3>
           <p className="text-xs font-bold text-slate-500 mt-2 uppercase">{teklif.cariler?.adres || 'Adres bilgisi girilmemiş.'}</p>
           <p className="text-xs font-bold text-slate-500 mt-1">{teklif.cariler?.telefon}</p>
        </div>

        {/* TABLO */}
        <table className="w-full mb-10">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
              <th className="py-4 px-4 text-left rounded-l-xl">ÜRÜN / HİZMET</th>
              <th className="py-4 px-4 text-center">MİKTAR</th>
              <th className="py-4 px-4 text-center">KDV</th>
              <th className="py-4 px-4 text-right">BİRİM FİYAT</th>
              <th className="py-4 px-4 text-right rounded-r-xl">TOPLAM</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold text-slate-700">
            {satirlar.map((item, index) => (
              <tr key={index} className="border-b border-slate-100">
                <td className="py-4 px-4 uppercase font-bold">{item.urun_ad}</td>
                <td className="py-4 px-4 text-center text-slate-500">{item.miktar} {item.birim}</td>
                <td className="py-4 px-4 text-center text-slate-400">% {item.kdv_orani || 20}</td>
                <td className="py-4 px-4 text-right text-slate-600">₺{item.birim_fiyat.toLocaleString()}</td>
                <td className="py-4 px-4 text-right font-black text-slate-900">₺{item.toplam_fiyat.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOPLAM */}
        <div className="flex justify-end mb-16">
           <div className="w-72 space-y-3">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                 <span className="text-xs font-bold text-slate-500">ARA TOPLAM</span>
                 {/* KDV HARİÇ TAHMİNİ */}
                 <span className="text-xs font-bold text-slate-800">₺{(teklif.toplam_tutar * 0.83).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                 <span className="text-xs font-bold text-slate-500">TOPLAM KDV</span>
                 <span className="text-xs font-bold text-slate-800">₺{(teklif.toplam_tutar * 0.17).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between bg-slate-900 text-white p-4 rounded-xl shadow-lg print:shadow-none print:border print:border-slate-900">
                 <span className="text-sm font-black uppercase tracking-wider">GENEL TOPLAM</span>
                 <span className="text-lg font-black tracking-tighter">₺{teklif.toplam_tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
           </div>
        </div>

        {/* ALT BİLGİ */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t-2 border-slate-100 pt-8">
           <div className="text-[9px] font-bold text-slate-400 w-1/2 leading-relaxed uppercase">
              <p>* Teklif {new Date(teklif.bitis_tarihi).toLocaleDateString('tr-TR')} tarihine kadar geçerlidir.</p>
              <p>* Fiyatlara KDV dahildir.</p>
              <p>* Ödeme yapılmadan teslimat yapılmamaktadır.</p>
              <p>* Durmazsaas Yazılım A.Ş. - Mersis: 0000000000</p>
           </div>
           <div className="text-center">
              <p className="text-[10px] font-black text-slate-900 uppercase mb-10 tracking-widest">DURMAZSAAS ONAY / KAŞE</p>
              <div className="h-0.5 w-40 bg-slate-900 mx-auto opacity-20"></div>
           </div>
        </div>

      </div>
    </div>
  );
}