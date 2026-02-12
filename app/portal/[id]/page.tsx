'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Wallet, Package, Calendar, Phone, CheckCircle2 } from 'lucide-react';

const MusteriPortal = () => {
  const { id } = useParams();
  const [data, setData] = useState<any>({ musteri: null, satislar: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const portalVerisiGetir = async () => {
      // Müşteri bilgisi
      const { data: m } = await supabase.from('cariler').select('*').eq('id', id).single();
      // Satış geçmişi (Ürün adıyla beraber)
      const { data: s } = await supabase.from('satislar')
        .select('*, envanter(urun_adi)')
        .eq('cari_id', id)
        .order('created_at', { ascending: false });

      setData({ musteri: m, satislar: s || [] });
      setLoading(false);
    };
    portalVerisiGetir();
  }, [id]);

  if (loading) return <div className="p-10 text-center font-bold">Yükleniyor...</div>;
  if (!data.musteri) return <div className="p-10 text-center">Bağlantı geçersiz.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-10 font-sans">
      <div className="bg-indigo-700 p-8 text-white rounded-b-[2.5rem] shadow-xl">
        <h1 className="text-2xl font-black">{data.musteri.ad_soyad}</h1>
        <p className="text-indigo-200 text-sm">Durmazsaas Müşteri Paneli</p>
      </div>

      <div className="px-5 -mt-8 space-y-6">
        {/* Bakiye Kartı */}
        <div className="bg-white p-8 rounded-[2rem] shadow-lg text-center border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Güncel Bakiyeniz</p>
          <p className="text-4xl font-black text-slate-800">₺{data.musteri.bakiye || '0'}</p>
        </div>

        {/* Satış Geçmişi */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 px-2">
            <Calendar size={20} className="text-indigo-600" /> Alım Geçmişi
          </h2>
          
          {data.satislar.map((satis: any) => (
            <div key={satis.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-400"><Package size={20} /></div>
                <div>
                  <p className="font-bold text-slate-800">{satis.envanter?.urun_adi}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {new Date(satis.created_at).toLocaleDateString('tr-TR')} - {satis.miktar} kg
                  </p>
                </div>
              </div>
              <p className="font-black text-slate-700">₺{satis.toplam_tutar}</p>
            </div>
          ))}
          {data.satislar.length === 0 && <p className="text-center text-slate-400 py-10 italic text-sm">Henüz bir işlem bulunmuyor.</p>}
        </div>

        {/* İletişim */}
        <a href={`tel:${data.musteri.telefon}`} className="block w-full bg-slate-900 text-white text-center py-5 rounded-2xl font-black shadow-lg">
          SORU SORMAK İÇİN ARA
        </a>
      </div>
    </div>
  );
};

export default MusteriPortal;