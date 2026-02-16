'use client';
import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Mail, Lock, Loader2, UserCircle, Building2, AlertCircle } from 'lucide-react';

export default function SmartLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectInfo, setRedirectInfo] = useState<{msg: string, url: string} | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRedirectInfo(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // Kullanıcının rolünü ve şirketini kontrol et
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, global_cari_code, company_id')
        .eq('id', authData.user.id)
        .single();

      if (!profile) throw new Error("Profil bulunamadı.");

      // MANTIKSAL YÖNLENDİRME (Patronun istediği Akıllı Kapı)
      const isCustomer = profile.role === 'customer' || !!profile.global_cari_code;
      const isAdmin = profile.role === 'admin' || profile.role === 'staff';

      // Mevcut URL'ye göre kontrol (Basitlik için varsayılan yönlendirmeler)
      if (isCustomer) {
        setRedirectInfo({
          msg: "Müşteri Portalına yönlendiriliyorsunuz...",
          url: `/portal/${profile.global_cari_code}`
        });
        setTimeout(() => window.location.href = `/portal/${profile.global_cari_code}`, 1500);
      } else if (isAdmin) {
        setRedirectInfo({
          msg: "İşletme Paneline (Dashboard) yönlendiriliyorsunuz...",
          url: `/dashboard`
        });
        setTimeout(() => window.location.href = `/dashboard`, 1500);
      }

    } catch (err: any) {
      setError("Giriş başarısız. Bilgilerinizi kontrol edin.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-4">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 border border-gray-100">
        <div className="text-center mb-10">
          <div className="bg-[#1B2559] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserCircle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-[#1B2559] uppercase tracking-tighter">Sisteme Giriş</h2>
          <p className="text-gray-400 text-sm font-medium">Güvenli erişim noktası</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100"><AlertCircle size={16}/> {error}</div>}
        
        {redirectInfo && (
          <div className="mb-6 p-4 bg-blue-50 text-[#3063E9] rounded-2xl flex flex-col items-center gap-2 text-xs font-bold border border-blue-100 animate-pulse">
            <Loader2 className="animate-spin" size={20} />
            {redirectInfo.msg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">E-Posta</label>
            <input type="email" required className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-[#3063E9] focus:bg-white outline-none font-bold text-[#1B2559] transition-all" placeholder="ornek@sirket.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Şifre</label>
            <input type="password" required className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:border-[#3063E9] focus:bg-white outline-none font-bold text-[#1B2559] transition-all" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-5 bg-[#3063E9] hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex justify-center items-center gap-2 active:scale-95">
            {loading ? <Loader2 className="animate-spin" /> : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}