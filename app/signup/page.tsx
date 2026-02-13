'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr'; // Yeni ve hatasız import
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Yeni Supabase istemcisi oluşturma yöntemi
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      alert('Kayıt başarılı! Lütfen e-posta kutunuzu (gereksiz kutusu dahil) kontrol edin.');
      router.push('/login');
    } catch (error: any) {
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-8">Durmaz SaaS'a Katıl</h2>
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">E-posta</label>
            <input
              type="email"
              className="w-full p-3 border border-gray-200 rounded-xl text-black focus:ring-2 focus:ring-green-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Şifre</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-200 rounded-xl text-black focus:ring-2 focus:ring-green-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-400 transform hover:scale-[1.02] transition-all"
          >
            {loading ? 'Hesap Oluşturuluyor...' : 'Hemen Kayıt Ol'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Zaten bir hesabın var mı? <Link href="/login" className="text-blue-600 font-bold hover:underline">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}