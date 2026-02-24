'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Rocket, ArrowRight, Store, Building2, 
  ChevronRight, Activity, Globe, ShieldCheck,
  Cpu, Zap, BarChart3, Layers, Database, MousePointer2
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-sans selection:bg-[#3063E9]/30 overflow-x-hidden relative">
      
      {/* --- KATMANLI DİNAMİK ARKA PLAN --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#3063E9]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#BC13FE]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute inset-0 opacity-[0.05]" style={{ 
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* --- NAVIGASYON --- */}
      <nav className="fixed top-6 w-full z-50 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-xl flex items-center justify-center">
              <Rocket className="text-white" size={22} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-[#3063E9]">SaaS</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#ozellikler" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white transition-all">Özellikler</a>
            <a href="#nasil-calisir" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white transition-all">Nasıl Çalışır?</a>
            {/* 🚀 SİBER YAMA: Akıllı Onboarding Motoruna Yönlendirildi */}
            <Link href="/onboarding" className="px-6 py-2.5 bg-white text-black text-[10px] font-black rounded-full uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2">
              Sisteme Giriş <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-56 pb-20 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-10 text-[#3063E9] animate-bounce">
            <Zap size={12} fill="currentColor" /> B2B Sektöründe Siber Devrim
          </div>
          <h1 className="text-6xl md:text-[110px] font-black leading-[0.85] tracking-tight uppercase italic mb-10">
            TİCARETİN <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3063E9] via-white to-[#BC13FE]">YENİ MERKEZİ</span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-500 text-lg font-bold mb-16 uppercase tracking-tight">
            Tedarikçiden son bayiye kadar tüm ağınızı tek bir radar altında toplayın. Kağıt işlerini bitirin, dijital hıza geçin.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
            {/* 🚀 SİBER YAMA: Akıllı Yönlendirmeye Bağlandı */}
            <Link href="/onboarding" className="px-12 py-6 bg-white text-black rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:-translate-y-2 transition-all flex items-center justify-center gap-3">
              <Building2 size={20} /> İŞLETME PANELİNE GİR
            </Link>
            <Link href="/onboarding" className="px-12 py-6 bg-[#0F1219] border border-white/10 text-white rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white/5 transition-all flex items-center justify-center gap-3">
              <Store size={20} className="text-[#BC13FE]" /> MÜŞTERİ PORTALINA GİR
            </Link>
          </div>
        </div>
      </section>

      {/* --- DETAYLI ÖZELLİKLER (BENTO GRID) --- */}
      <section id="ozellikler" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black uppercase italic mb-4">Neden DurmazSaaS?</h2>
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.5em]">Geleneksel ticaretin siber zırhlı hali</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-full md:h-[600px]">
          {/* Büyük Kart: Siber Radar */}
          <div className="md:col-span-2 md:row-span-2 bg-[#0F1219] border border-white/5 rounded-[40px] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#3063E9]/10 blur-[80px] rounded-full" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#020408] rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
                <BarChart3 className="text-[#3063E9]" size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase italic mb-4">360° SİBER RADAR</h3>
              <p className="text-gray-500 text-xs font-bold leading-relaxed uppercase tracking-widest mb-8">
                Bayilerinizin stok hareketlerini, sipariş yoğunluğunu ve ödeme dengelerini yapay zeka destekli grafiklerle canlı takip edin. Hiçbir hareket gözünüzden kaçmaz.
              </p>
              <div className="flex gap-2">
                <div className="h-1 w-12 bg-[#3063E9] rounded-full" />
                <div className="h-1 w-4 bg-white/10 rounded-full" />
                <div className="h-1 w-4 bg-white/10 rounded-full" />
              </div>
            </div>
            {/* Görsel Detay İllüstrasyonu */}
            <div className="absolute bottom-[-20px] right-[-20px] opacity-20 group-hover:opacity-40 transition-opacity">
              <Cpu size={200} />
            </div>
          </div>

          {/* Orta Kart: Otomatik Fatura */}
          <div className="md:col-span-2 bg-[#0F1219] border border-white/5 rounded-[40px] p-10 flex items-center justify-between group overflow-hidden">
            <div className="max-w-[60%]">
              <h3 className="text-xl font-black uppercase italic mb-3">AKILLI MUHASEBE</h3>
              <p className="text-gray-500 text-[10px] font-bold leading-relaxed uppercase tracking-widest">
                Sipariş onaylandığı an fatura ERP sisteminize düşer. Manuel veri girişi hatalarına son verin.
              </p>
            </div>
            <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Database className="text-[#BC13FE]" size={40} />
            </div>
          </div>

          {/* Küçük Kart 1: Hız */}
          <div className="bg-[#0F1219] border border-white/5 rounded-[40px] p-8 text-center group hover:border-[#3063E9]/30 transition-all">
            <Layers className="text-green-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-2">Işık Hızında</h4>
            <p className="text-[9px] font-bold text-gray-600 uppercase">0.4ms işlem süresi</p>
          </div>

          {/* Küçük Kart 2: Güvenlik */}
          <div className="bg-[#0F1219] border border-white/5 rounded-[40px] p-8 text-center group hover:border-[#BC13FE]/30 transition-all">
            <ShieldCheck className="text-[#BC13FE] mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-2">Uçtan Uca</h4>
            <p className="text-[9px] font-bold text-gray-600 uppercase">256-bit SSL Zırhı</p>
          </div>
        </div>
      </section>

      {/* --- NASIL ÇALIŞIR? (STEP BY STEP) --- */}
      <section id="nasil-calisir" className="py-32 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-xl">
              <h2 className="text-5xl font-black uppercase italic mb-6 leading-none">İŞLETME PROTOKOLÜ <br /> <span className="text-[#3063E9]">NASIL ÇALIŞIR?</span></h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">Sisteme entegre olmak 3 adımdan daha kısa sürer.</p>
            </div>
            <div className="flex gap-4">
               <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-gray-500"><MousePointer2 size={18} /></div>
               <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black">?</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            <div className="hidden md:block absolute top-10 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />
            
            {[
              { num: '01', title: 'HESAP OLUŞTUR', desc: 'İşletme sahibi olarak kayıt olun ve siber panelinize giriş yapın.' },
              { num: '02', title: 'BAYİLERİ DAVET ET', desc: 'Global Cari Kod sistemimizle tüm müşterilerinizi tek tıkla ağa dahil edin.' },
              { num: '03', title: 'TİCARETİ BAŞLAT', desc: 'Canlı stoklar ve otomatik ödeme sistemleriyle büyümeyi izleyin.' }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="w-20 h-20 bg-[#020408] border border-white/10 rounded-full flex items-center justify-center text-3xl font-black italic mb-8 shadow-[0_0_30px_rgba(48,99,233,0.2)]">
                  {step.num}
                </div>
                <h4 className="text-lg font-black uppercase tracking-widest mb-4 italic">{step.title}</h4>
                <p className="text-gray-500 text-[11px] font-bold leading-relaxed uppercase tracking-widest">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: 'Yıllık İşlem', val: '1.2B+' },
            { label: 'Aktif Bayi', val: '40.000' },
            { label: 'Hata Payı', val: '%0.001' },
            { label: 'Ülke', val: '12' }
          ].map((stat, i) => (
            <div key={i} className="group cursor-default">
              <span className="text-5xl font-black text-white italic group-hover:text-[#3063E9] transition-colors">{stat.val}</span>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.5em] mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#0F1219] to-black rounded-[60px] p-16 md:p-24 text-center border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_#3063E915_0%,transparent_70%)]" />
          <h2 className="text-5xl md:text-7xl font-black mb-12 uppercase italic relative z-10 leading-tight">
            TİCARETİN GELECEĞİNE <br /> <span className="text-[#3063E9]">ŞİMDİ</span> BAĞLAN
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
            {/* 🚀 SİBER YAMA: Akıllı Onboarding'e gönderir */}
            <Link href="/onboarding" className="px-12 py-7 bg-white text-black rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] hover:bg-gray-200 transition-all">
              Hemen Kayıt Ol
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-8 opacity-30">
           <div className="w-8 h-[1px] bg-white" />
           <Rocket size={16} />
           <div className="w-8 h-[1px] bg-white" />
        </div>
        <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.8em]">© 2026 DURMAZSAAS // GLOBAL TECH INFRASTRUCTURE</p>
      </footer>

    </div>
  );
}