'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Mail, Lock, User, ArrowRight, Loader2, Rocket } from 'lucide-react';

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Supabase'e Kullanıcıyı Kaydet
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (authError) throw authError;

      // Eğer kullanıcı başarıyla oluştuysa işlemlere devam et
      if (authData?.user) {
        
        // 2. İşletmeyi (Company) Oluştur
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert([{ name: companyName }])
          .select()
          .single();

        if (companyError) throw companyError;
        if (!companyData) throw new Error("Şirket kasası oluşturulamadı.");

        // 3. Kullanıcının profiline bu şirketin ID'sini yaz
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ company_id: companyData.id, full_name: fullName })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        // 4. Yönlendirme: E-posta onayı kapalıysa direkt panele, açıksa giriş sayfasına at.
        if (authData?.session) {
          router.push('/dashboard');
        } else {
          alert("Kayıt başarılı! Lütfen e-posta adresinize gelen onay linkine tıklayın.");
          router.push('/login');
        }
      }

    } catch (err: any) {
      setError(err.message || 'Kayıt olurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F4F7FE]">
      
      {/* SOL TARAF: MARKALAŞMA VE VİZYON */}
      <div className="hidden lg:flex w-1/2 bg-[#1B2559] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-12 h-12 bg-[#3063E9] rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/50">Y</div>
            <span className="text-3xl font-black tracking-tighter">Yusuf<span className="text-[#3063E9]">SaaS</span></span>
          </div>
          <h1 className="text-5xl font-black leading-tight mb-6 tracking-tighter">
            Toptan Ticaretinizi <br/><span className="text-[#3063E9]">Dijitale Taşıyın.</span>
          </h1>
          <p className="text-lg text-gray-300 font-medium max-w-md">
            Müşteri carilerinizi, B2B siparişlerinizi ve kasanızı tek bir ekrandan yönetin. Hemen kendi işletmenizi kurun.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-500 p-3 rounded-full"><Rocket size={24} className="text-white"/></div>
            <div>
              <h4 className="font-bold text-white">Dakikalar İçinde Hazır</h4>
              <p className="text-sm text-gray-300">Kurulum gerektirmez, hemen faturaya başlayın.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SAĞ TARAF: KAYIT FORMU */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-black text-[#1B2559] tracking-tighter uppercase mb-2">İşletmenizi Kurun</h2>
            <p className="text-gray-500 font-medium">Sisteme katılıp B2B panelinizi hemen oluşturun.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold mb-6 border border-red-100 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* ŞİRKET ADI */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Firma / İşletme Adı</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Building2 size={20} className="text-gray-400" /></div>
                <input 
                  type="text" required
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-[#3063E9] focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-[#1B2559]"
                  placeholder="Örn: Yıldızlar Gıda Tic. Ltd. Şti."
                  value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>

            {/* YETKİLİ ADI */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Yetkili Ad Soyad</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={20} className="text-gray-400" /></div>
                <input 
                  type="text" required
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-[#3063E9] focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-[#1B2559]"
                  placeholder="Adınız ve Soyadınız"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            {/* E-POSTA */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">E-Posta Adresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={20} className="text-gray-400" /></div>
                <input 
                  type="email" required
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-[#3063E9] focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-[#1B2559]"
                  placeholder="ornek@sirket.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* ŞİFRE */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Şifre Belirleyin</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={20} className="text-gray-400" /></div>
                <input 
                  type="password" required minLength={6}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-[#3063E9] focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-[#1B2559]"
                  placeholder="En az 6 karakter"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* BUTON */}
            <button 
              type="submit" disabled={loading}
              className="w-full py-4 bg-[#3063E9] hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 transition-all flex justify-center items-center gap-2 active:scale-95 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <><ArrowRight size={24} /> Dükkanı Aç ve Başla</>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-gray-500">
            Zaten bir hesabınız var mı?{' '}
            <Link href="/login" className="text-[#3063E9] font-black hover:underline">Giriş Yapın</Link>
          </p>

        </div>
      </div>
    </div>
  );
}