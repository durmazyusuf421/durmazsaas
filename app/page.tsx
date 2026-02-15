import Link from 'next/link';
import { ArrowRight, BarChart3, Users, ShoppingCart, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FE] font-sans selection:bg-[#3063E9] selection:text-white">
      
      {/* 🚀 NAVBAR (ÜST MENÜ) */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#3063E9] rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/30">Y</div>
            <span className="text-2xl font-black text-[#1B2559] tracking-tighter">Yusuf<span className="text-[#3063E9]">SaaS</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block font-bold text-gray-500 hover:text-[#3063E9] transition-colors">
              Giriş Yap
            </Link>
            <Link href="/register" className="bg-[#1B2559] hover:bg-blue-900 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2">
              Dükkanı Aç <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </nav>

      {/* 🌟 HERO (KARŞILAMA) BÖLÜMÜ */}
      <section className="pt-40 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full text-sm font-bold text-[#3063E9] mb-8 animate-fade-in-up">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>
            B2B Toptan Ticaretin Yeni Nesil Yüzü
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-[#1B2559] tracking-tighter leading-tight mb-8">
            Toptan İşletmenizi <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3063E9] to-blue-400">
              Tek Ekrandan Yönetin.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Müşteri carileri, B2B sipariş portalları, tahsilatlar ve giderler... Koca bir muhasebe sistemini karmaşadan uzak, saniyeler içinde kurun.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-[#3063E9] hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 transition-all flex justify-center items-center gap-2 active:scale-95">
              Ücretsiz Başla <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 text-[#1B2559] hover:border-[#3063E9] hover:text-[#3063E9] rounded-2xl font-black uppercase tracking-widest transition-all text-center">
              Zaten Hesabım Var
            </Link>
          </div>
        </div>
      </section>

      {/* 🎯 ÖZELLİKLER BÖLÜMÜ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#1B2559] tracking-tighter uppercase mb-4">Neden YusufSaaS?</h2>
            <p className="text-gray-500 font-medium">İşletmenizi büyütmek için ihtiyacınız olan tüm araçlar burada.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* KART 1 */}
            <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 hover:border-[#3063E9] hover:shadow-2xl hover:shadow-blue-500/10 transition-all group">
              <div className="w-16 h-16 bg-blue-100 text-[#3063E9] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-black text-[#1B2559] mb-3">Kusursuz Cari Takibi</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Müşterilerinizin borç, alacak ve tahsilatlarını şeffaf bir şekilde yönetin. Kimin ne kadar borcu var saniyeler içinde görün.
              </p>
            </div>

            {/* KART 2 */}
            <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/10 transition-all group">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-xl font-black text-[#1B2559] mb-3">B2B Müşteri Portalı</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Müşterilerinize özel sipariş paneli sunun. Kataloğunuzdan ürün seçsinler, siz onaylayın, sipariş otomatik faturaya dönüşsün.
              </p>
            </div>

            {/* KART 3 */}
            <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/10 transition-all group">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 size={32} />
              </div>
              <h3 className="text-xl font-black text-[#1B2559] mb-3">Kasa ve Finans Merkezi</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                İşletmenizin giderlerini ve gelirlerini tek ekranda toplayın. Çıkan ve giren parayı anlık olarak grafiklerle takip edin.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 🛡️ GÜVENLİK VE BİTİŞ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-[#1B2559] rounded-[40px] p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          
          <ShieldCheck size={64} className="mx-auto text-[#3063E9] mb-6" />
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">Verileriniz Güvende, İşiniz Tıkırında.</h2>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Gelişmiş bulut altyapısı sayesinde hiçbir evrakınız kaybolmaz. İzole veritabanı mimarisiyle sadece sizin erişiminize açıktır.
          </p>
          <Link href="/register" className="inline-flex px-10 py-5 bg-white text-[#1B2559] hover:bg-gray-50 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 items-center gap-2">
            Hemen Dükkanını Aç <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-gray-400 font-medium border-t border-gray-200">
        <p>© {new Date().getFullYear()} YusufSaaS - Tüm hakları saklıdır. Patronlara Özel Geliştirildi. 🦅</p>
      </footer>

    </div>
  );
}