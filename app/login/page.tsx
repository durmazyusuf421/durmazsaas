'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase'; // Yolunu kontrol et: @/app/lib/supabase de olabilir
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    // 1. Supabase ile giriş isteği gönder
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 2. Eğer GERÇEK bir hata varsa
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 3. Eğer giriş başarılıysa (Burada setLoading(false) YAPMIYORUZ)
    if (data?.user) {
      console.log("Giriş başarılı, yönlendiriliyor...");
      // Sayfayı yenilemeden önce çerezlerin (cookies) oturması için çok kısa bir bekleme
      router.refresh(); 
      window.location.href = '/'; 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800 transition-all">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-blue-600 dark:text-blue-500 tracking-tighter italic">DURMAZSAAS</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Yönetim Paneline Giriş Yapın</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Hata Mesajı Alanı: Sadece gerçek bir hata varsa ve yükleme bittiyse göster */}
          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/30 animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">E-Posta</label>
            <input
              type="email"
              required
              placeholder="mesut@durmaztoptan.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Şifre</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-4 rounded-xl transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 disabled:opacity-80 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                GİRİŞ YAPILIYOR...
              </>
            ) : (
              'PANELİ AÇ'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}