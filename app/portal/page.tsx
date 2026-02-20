'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, Store, AlertTriangle, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function GlobalCustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);
  
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function autoRedirectIfLoggedIn() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const profileData = profile as any;
        const globalCode = profileData?.global_cari_code;
        const isCustomer = profileData?.is_customer;
        const companyId = profileData?.company_id;

        // Hem patron hem müşteriyse veya sadece müşteriyse portalına al
        if (isCustomer || globalCode) {
          window.location.href = `/portal/${globalCode}`;
        } else if (companyId) {
          // Sadece dükkanı varsa işletmesine fırlat
          window.location.href = `/portal/${companyId}/business`;
        } else {
          window.location.href = '/onboarding';
        }
      } else {
        setLoading(false);
      }
    }
    autoRedirectIfLoggedIn();
  }, [supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRedirectMessage(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Kullanıcı bulunamadı.");

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      const profileData = profile as any;
      const globalCode = profileData?.global_cari_code;
      const isCustomer = profileData?.is_customer;
      const companyId = profileData?.company_id;

      if (isCustomer || globalCode) {
        window.location.href = `/portal/${globalCode}`;
      } else {
         setRedirectMessage("İşletme bilgilerinizle Müşteri Portalına girmeye çalıştınız. Sistem sizi İşletme Panelinize yönlendiriyor...");
         setTimeout(() => {
           if (companyId) {
             window.location.href = `/portal/${companyId}/business`;
           } else {
             window.location.href = '/onboarding';
           }
         }, 3500);
      }
      
    } catch (err: any) {
      setError("E-posta veya şifre hatalı.");
      setLoading(false); 
    }
  };

  if (loading && !redirectMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E14]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#BC13FE] w-12 h-12" />
          <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs">Siber Radara Bağlanılıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0E14] p-4 font-sans text-white relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,_#BC13FE15_0%,transparent_50%)] -z-10" />
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="bg-[#0F1219] w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-white/5 relative z-10">
        <div className="p-10 text-center relative overflow-hidden border-b border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#BC13FE] opacity-10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="w-16 h-16 bg-[#0B0E14] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Store className="text-[#BC13FE]" size={32} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">Müşteri Portalı</h2>
          <p className="text-gray-500 text-xs font-bold mt-2 uppercase tracking-widest">Siber Ağa Bağlan</p>
        </div>

        <div className="p-8">
          {redirectMessage ? (
             <div className="bg-[#1A150B] border border-amber-500/20 p-6 rounded-3xl text-center">
                <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4 animate-bounce" />
                <p className="text-amber-500 font-bold text-xs uppercase tracking-widest">{redirectMessage}</p>
                <Loader2 className="animate-spin text-amber-500 mx-auto mt-4 w-8 h-8" />
             </div>
          ) : (
            <React.Fragment>
              {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-xs font-bold border border-red-500/20 text-center mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-[0.2em]">E-Posta Adresi</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      required 
                      className="w-full pl-11 pr-4 py-4 bg-[#0B0E14] border border-white/5 rounded-2xl outline-none focus:border-[#BC13FE] transition-all font-bold text-white" 
                      placeholder="ornek@mail.com"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-[0.2em]">Şifreniz</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password" 
                      required 
                      className="w-full pl-11 pr-4 py-4 bg-[#0B0E14] border border-white/5 rounded-2xl outline-none focus:border-[#BC13FE] transition-all font-bold text-white" 
                      placeholder="••••••••"
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 bg-gradient-to-r from-[#0B0E14] to-[#0F1219] border border-white/10 hover:border-[#BC13FE]/50 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all flex justify-center items-center gap-3 active:scale-95 group shadow-lg"
                >
                  <span>Ağa Giriş Yap</span>
                  <ArrowRight size={16} className="text-[#BC13FE] group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-600 mb-3 uppercase tracking-widest">Henüz global kodunuz yok mu?</p>
                  <Link 
                    href="/portal/register" 
                    className="inline-block text-[#BC13FE] font-black hover:text-white transition-colors uppercase text-[10px] tracking-[0.2em] bg-[#BC13FE]/10 border border-[#BC13FE]/20 px-6 py-3 rounded-xl"
                  >
                    Yeni Global Cari Kod Al
                  </Link>
                </div>
                
                <Link href="/login" className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-600 hover:text-white transition-colors uppercase tracking-[0.2em] mt-2">
                  <Building2 size={14} />
                  <span>İşletme Girişine Git</span>
                </Link>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}