import Link from 'next/link';
import { 
  ArrowRight, 
  BarChart3, 
  Users, 
  ShoppingCart, 
  ShieldCheck, 
  UserCircle, 
  Building2, 
  LayoutDashboard 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FE] font-sans selection:bg-[#3063E9] selection:text-white">
      
      {/* 🚀 NAVBAR (ÜST MENÜ) */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 text-decoration-none">
            <div className="w-10 h-10 bg-[#3063E9] rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/30">Y</div>
            <span className="text-2xl font-black text-[#1B2559] tracking-tighter">Yusuf<span className="text-[#3063E9]">SaaS</span></span>
          </div>
          
          {/* Butonlar */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* MÜŞTERİ KAPISI */}
            <Link href="/portal" className="flex items-center gap-2 text-sm md:text-base font-bold text-[#3063E9] hover:text-blue-700 transition-colors">
              <UserCircle size={20} className="hidden sm:block" />
              Müşteri Girişi
            </Link>

            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

            {/* İŞLETME KAPISI */}
            <Link href="/login" className="hidden md:flex items-center gap-2 font-bold text-gray-500 hover:text-[#1B2559] transition-colors">
              <Building2 size={18} />
              İşletme Girişi
            </Link>

            <Link href="/register" className="bg-[#1B2559] hover:bg-blue-900 text-white px-4 md:px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2">
              <LayoutDashboard size={18} className="hidden sm:block" />
              Dükkan Aç
            </Link>
          </div>
        </div>
      </nav>

      {/* 🌟 HERO (KARŞILAMA) BÖLÜMÜ */}
      <section className="pt-44 pb-24 px-6 text-center bg-gradient-to-b from-white to-[#F4F7FE]">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full text-sm font-bold text-[#3063E9] mb-8">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Tüm Toptan Süreçleriniz Tek Bir Çatı Altında
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-[#1B2559] tracking-tighter leading-tight mb-8">
            İşletmeniz İçin <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3063E9] to-blue-400">
              Modern B2B Çözümü.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            Müşterilerinize şifresiz, cari kodlu portal sunun. Siparişlerinizi dijitalden alın, kasanızı ve masraflarınızı profesyonelce yönetin.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link href="/register" className="w-full sm:w-auto px-10 py-5 bg-[#3063E9] hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-500/40 transition-all flex justify-center items-center gap-2 active:scale-95 text-lg">
              Hemen İşletmeni Kur <ArrowRight size={22} />
            </Link>
            <Link href="/portal" className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-gray-200 text-[#1B2559] hover:border-[#3063E9] hover:text-[#3063E9] rounded-2xl font-black uppercase tracking-widest transition-all text-center text-lg">
              Müşteri Girişi Yap
            </Link>
          </div>
        </div>
      </section>

      {/* 🎯 ÖZELLİKLER BÖLÜMÜ */}
      <section className="py-24 px-6 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* KART 1: MÜŞTERİ PANELİ */}
            <div className="p-4 group">
              <div className="w-16 h-16 bg-blue-100 text-[#3063E9] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#3063E9] group-hover:text-white transition-all duration-300">
                <UserCircle size={32} />
              </div>
              <h3 className="text-2xl font-black text-[#1B2559] mb-4 uppercase tracking-tighter">Müşteri Portalı</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Müşterileriniz kendilerine özel üretilen <strong>Cari Kod</strong> ile giriş yapar. Ekstrelerini indirir, güncel borçlarını görür ve sipariş verirler.
              </p>
            </div>

            {/* KART 2: SİPARİŞ MUTABAKATI */}
            <div className="p-4 group">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-2xl font-black text-[#1B2559] mb-4 uppercase tracking-tighter">Akıllı Sipariş</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Sepetler havada asılı kalmaz! Müşteri talep gönderir, siz fiyatlandırır ve onayına sunarsınız. Her iki taraf onaylayınca kasa otomatik işler.
              </p>
            </div>

            {/* KART 3: FİNANS MERKEZİ */}
            <div className="p-4 group">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                <BarChart3 size={32} />
              </div>
              <h3 className="text-2xl font-black text-[#1B2559] mb-4 uppercase tracking-tighter">Kasa & Masraflar</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Dükkanın giren ve çıkan her kuruşu kayıt altında. Giderleri kategori kategori ayırın, ay sonu kârlılığınızı net bir şekilde görün.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 🛡️ GÜVENLİK VE ÇAĞRI */}
      <section className="py-24 px-6 bg-[#F4F7FE]">
        <div className="max-w-5xl mx-auto bg-[#1B2559] rounded-[48px] p-12 md:p-20 text-center text-white shadow-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 opacity-20 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3"></div>
          
          <ShieldCheck size={72} className="mx-auto text-[#3063E9] mb-8" />
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-tight">İşinizi Cebinizden <br /> Profesyonelce Yönetin.</h2>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium">
            Sadece toptancılar için değil, imalatçılar ve bayilik sistemiyle çalışan tüm işletmeler için en hızlı çözüm.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-10 py-5 bg-[#3063E9] text-white hover:bg-blue-600 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 items-center gap-2 flex justify-center">
              Dükkanımı Aç <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center border-t border-gray-200">
        <div className="flex justify-center items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-500">Y</div>
          <span className="font-black text-[#1B2559] tracking-tighter italic uppercase">YusufSaaS Platformu</span>
        </div>
        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
          © {new Date().getFullYear()} Tüm Hakları Saklıdır • Patronlar İçin Geliştirildi 🦅
        </p>
      </footer>

    </div>
  );
}