'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, UserCircle, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function GlobalCustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Kullanıcı girişi (Auth)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Kullanıcı bulunamadı.");

      // 2. Profil tablosundan bu kullanıcının Global Cari Kodunu çekiyoruz
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // Global kodu alıyoruz
      const globalCode = (profile as any)?.global_cari_code;

      if (globalCode) {
        // 🚀 GARANTİ YÖNLENDİRME: router.push bazen takılabilir, bu yöntem sayfayı zorla açar.
        window.location.href = `/portal/${globalCode}`;
      } else {
        // Eğer global kodu yoksa işletme panelidir
        window.location.href = '/dashboard';
      }
      
    } catch (err: any) {
      console.error('Giriş Hatası:', err.message);
      setError("Giriş yapılamadı. Bilgilerinizi kontrol edin.");
      setLoading(false); // Sadece hata durumunda loading'i kapatıyoruz, başarılıysa zaten sayfa değişecek.
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
        
        {/* ÜST MAVİ PANEL */}
        <div className="bg-[#1B2559] p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <UserCircle size={60} className="mx-auto text-white mb-4 opacity-90" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Müşteri Portalı</h2>
          <p className="text-blue-200 text-sm font-medium mt-1">Global hesabınızla güvenli giriş yapın.</p>
        </div>

        {/* FORM ALANI */}
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold border border-red-100 text-center mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">E-Posta Adresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  required 
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:border-[#3063E9] focus:bg-white transition-all font-bold text-[#1B2559]" 
                  placeholder="ornek@sirket.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Şifreniz</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required 
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:border-[#3063E9] focus:bg-white transition-all font-bold text-[#1B2559]" 
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#3063E9] hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex justify-center items-center gap-2 active:scale-95"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* ALT BİLGİ VE LİNKLER */}
          <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col gap-4">
            <div className="text-center">
              <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-tighter">Henüz global kodunuz yok mu?</p>
              <Link 
                href="/portal/register" 
                className="inline-block text-[#3063E9] font-black hover:text-blue-800 transition-colors uppercase text-xs tracking-widest bg-blue-50 px-6 py-2.5 rounded-xl"
              >
                Yeni Global Cari Kod Al
              </Link>
            </div>
            
            <Link href="/" className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-[#1B2559] transition-colors">
              <Building2 size={14} />
              <span>Ana Sayfaya Dön</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}