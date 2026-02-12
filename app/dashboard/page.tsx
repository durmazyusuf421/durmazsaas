'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; 
import { Wallet, TrendingUp, Package, FileText, Users, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    toplamAlacak: 0,
    depoDegeri: 0,
    bekleyenTeklif: 0,
    toplamMusteri: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      // 1. Müşterilerden Toplam Alacak (Bakiye toplamı)
      const { data: cariler } = await supabase.from('cariler').select('bakiye');
      const alacak = cariler?.reduce((acc, curr) => acc + (Number(curr.bakiye) || 0), 0) || 0;

      // 2. Depo Değeri (Stok * Alış Fiyatı)
      const { data: urunler } = await supabase.from('urunler').select('stok, alis');
      const depo = urunler?.reduce((acc, curr) => acc + (Number(curr.stok) * Number(curr.alis)), 0) || 0;

      // 3. Bekleyen Teklif Sayısı
      const { count: teklifSayisi } = await supabase.from('teklifler').select('*', { count: 'exact', head: true }).eq('durum', 'BEKLEMEDE');

      // 4. Toplam Müşteri
      const { count: musteriSayisi } = await supabase.from('cariler').select('*', { count: 'exact', head: true });

      setStats({
        toplamAlacak: alacak,
        depoDegeri: depo,
        bekleyenTeklif: teklifSayisi || 0,
        toplamMusteri: musteriSayisi || 0
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-8 px-4 animate-in fade-in duration-500">
      
      {/* BAŞLIK */}
      <div>
        <h1 className="text-3xl font-black text-[#0f172a] tracking-tighter uppercase">Genel Bakış</h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">İşler nasıl gidiyor Yusuf?</p>
      </div>

      {/* KARTLAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Kart 1: Toplam Alacak */}
        <div className="bg-[#0f172a] p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-10 -mt-10 blur-3xl transition-all group-hover:bg-blue-500/30"></div>
          <Wallet className="mb-4 text-blue-400" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOPLAM ALACAK</p>
          <p className="text-3xl font-black tracking-tighter mt-1">₺{stats.toplamAlacak.toLocaleString('tr-TR')}</p>
        </div>

        {/* Kart 2: Depo Değeri */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
          <Package className="mb-4 text-emerald-500" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DEPO MAL DEĞERİ</p>
          <p className="text-3xl font-black tracking-tighter text-slate-800 mt-1">₺{stats.depoDegeri.toLocaleString('tr-TR')}</p>
        </div>

        {/* Kart 3: Bekleyen Teklifler */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
          <FileText className="mb-4 text-violet-500" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BEKLEYEN TEKLİF</p>
          <p className="text-3xl font-black tracking-tighter text-slate-800 mt-1">{stats.bekleyenTeklif} <span className="text-sm text-slate-400 font-bold">ADET</span></p>
        </div>

        {/* Kart 4: Müşteri Sayısı */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
          <Users className="mb-4 text-rose-500" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOPLAM MÜŞTERİ</p>
          <p className="text-3xl font-black tracking-tighter text-slate-800 mt-1">{stats.toplamMusteri} <span className="text-sm text-slate-400 font-bold">KİŞİ</span></p>
        </div>

      </div>

      {/* ALT BİLGİ */}
      <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
        <AlertCircle className="text-blue-600 shrink-0" size={24} />
        <div>
          <h3 className="font-black text-blue-900 text-sm uppercase">Sistem Durumu</h3>
          <p className="text-xs font-bold text-blue-700 mt-1">Veritabanı bağlantısı aktif. Kasa, Stok ve Cari modülleri sorunsuz çalışıyor. Teklif robotu devrede.</p>
        </div>
      </div>
    </div>
  );
}