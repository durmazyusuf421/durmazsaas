'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, Loader2, Crown } from 'lucide-react';

// Veritabanından gelecek veri tipi
type Paket = {
  id: number;
  ad: string;
  fiyat: number;
  para_birimi: string;
  periyot: string;
  ozellikler: string[]; // JSONB'den diziye dönecek
  populer_mi: boolean;
};

export default function AbonelikPage() {
  const [paketler, setPaketler] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(true);

  // Paketleri Supabase'den Çek
  useEffect(() => {
    const fetchPaketler = async () => {
      setLoading(true);
      let { data, error } = await supabase
        .from('paketler')
        .select('*')
        .order('id', { ascending: true }); // ID sırasına göre getir

      if (error) {
        console.error("Paketler çekilemedi:", error);
      } else if (data) {
        // JSONB gelen özellikleri string dizisine çevir
        const formattedData = data.map(pkg => ({
            ...pkg,
            ozellikler: typeof pkg.ozellikler === 'string' ? JSON.parse(pkg.ozellikler) : pkg.ozellikler
        }));
        setPaketler(formattedData);
      }
      setLoading(false);
    };

    fetchPaketler();
  }, []);

  const satinAl = (paketAdi: string) => {
    // BURASI ÖNEMLİ: İleride buraya Stripe/Iyzico ödeme ekranı yönlendirmesi gelecek.
    alert(`"${paketAdi}" paketi seçildi! Ödeme entegrasyonu yakında eklenecek.`);
  };

  if (loading) {
    return (
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
        </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto py-16 px-4 animate-in fade-in duration-700 pb-32">
      
      {/* BAŞLIK ALANI */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          İşinize En Uygun Planı Seçin
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
          Durmazsaas ile işletmenizi büyütün. Şeffaf fiyatlandırma, gizli ücret yok. İstediğiniz zaman iptal edin.
        </p>
      </div>

      {/* PAKET KARTLARI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {paketler.map((paket) => (
          <div 
            key={paket.id}
            className={`relative flex flex-col p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] transition-all duration-300 hover:-translate-y-2
            ${paket.populer_mi 
                ? 'border-4 border-indigo-500 shadow-2xl shadow-indigo-500/20 md:scale-110 z-10' // Popüler paket öne çıksın
                : 'border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl'}`
            }
          >
            {/* Popüler Etiketi */}
            {paket.populer_mi && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <Crown size={16} /> EN ÇOK TERCİH EDİLEN
                </div>
            )}

            {/* Paket Başlığı ve Fiyat */}
            <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                    {paket.ad}
                </h3>
                <div className="flex items-baseline">
                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                        ₺{paket.fiyat}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2 font-bold">
                        {paket.periyot}
                    </span>
                </div>
            </div>

            {/* Özellik Listesi */}
            <ul className="flex-1 space-y-4 mb-8">
                {paket.ozellikler && paket.ozellikler.map((ozellik, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className={`shrink-0 ${paket.populer_mi ? 'text-indigo-500' : 'text-emerald-500'}`} size={20} />
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-tight">
                            {ozellik}
                        </span>
                    </li>
                ))}
                {/* Örnek olarak olmayan bir özellik göstermek istersen */}
                {!paket.populer_mi && paket.ad === 'BAŞLANGIÇ' && (
                    <li className="flex items-start gap-3 opacity-50">
                        <XCircle className="shrink-0 text-slate-400" size={20} />
                        <span className="text-slate-500 line-through font-medium text-sm leading-tight">
                            API Erişimi Yok
                        </span>
                    </li>
                )}
            </ul>

            {/* Satın Al Butonu */}
            <button 
                onClick={() => satinAl(paket.ad)}
                className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all active:scale-95
                ${paket.populer_mi
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                }`}
            >
                HEMEN BAŞLA
            </button>
          </div>
        ))}
      </div>

      {/* Alt Bilgi */}
      <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-12 font-medium">
        Tüm fiyatlara KDV dahildir. Kurumsal plan için lütfen iletişime geçiniz.
      </p>

    </div>
  );
}