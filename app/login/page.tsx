'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Rocket, Mail, Lock, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Supabase Auth ile Giriş Yap
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // 2. Kullanıcının Kim Olduğunu Anla (Müşteri mi Toptancı mı?)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_customer')
        .eq('id', authData.user.id)
        .single();

      // 🚀 ROTAYI DÜZELTTİK: Müşteri ise onu Siber Merkeze (Customer Hub) yolla
      if (profileData && profileData.is_customer) {
        router.push(`/portal/customer-hub`);
        return; // İşlemi bitir, aşağıya inme
      }

      // 3. Eğer müşteri değilse Toptancıdır
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('cari_code, name, id')
        .eq('owner_id', authData.user.id)
        .single();

      if (companyError) throw new Error("Şirket profiliniz bulunamadı.");

      // Toptancıyı kendi business paneline gönder
      const slug = companyData.cari_code || companyData.name || companyData.id;
      router.push(`/portal/${slug}/business`);
      
    } catch (err: any) {
      alert("Giriş Hatası: Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center font-sans p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#3063E9]/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="w-full max-w-md bg-[#0F1219] rounded-[50px] border border-white/5 p-12 shadow-2xl relative z-10">
        <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-[#3063E9]/10 rounded-3xl border border-[#3063E9]/20 mb-6"><Rocket size={32} className="text-[#3063E9]" /></div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">SİSTEME <span className="text-[#3063E9]">GİRİŞ</span></h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-3 italic text-center">Güvenli Erişim Noktası</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">E-Posta Adresi</label>
                <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#3063E9] transition-colors" size={20} />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0B0E14] border border-white/10 rounded-3xl py-6 pl-16 pr-6 text-sm font-bold focus:border-[#3063E9] outline-none transition-all placeholder:text-gray-800 text-white" />
                </div>
            </div>
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Güvenlik Parolası</label>
                <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#BC13FE] transition-colors" size={20} />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0B0E14] border border-white/10 rounded-3xl py-6 pl-16 pr-6 text-sm font-bold focus:border-[#BC13FE] outline-none transition-all placeholder:text-gray-800 text-white" />
                </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-7 bg-white text-black rounded-[30px] font-black uppercase text-xs tracking-[0.4em] shadow-[0_15px_40px_rgba(255,255,255,0.1)] hover:bg-gray-200 active:scale-[0.97] transition-all flex items-center justify-center gap-4 group">
                {loading ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={24} />} 
                {loading ? 'YETKİ DENETLENİYOR...' : 'GİRİŞ YAP'} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
        </form>
        <div className="mt-12 text-center border-t border-white/5 pt-8">
            <Link href="/register" className="text-[10px] font-black text-gray-500 hover:text-[#3063E9] uppercase tracking-widest transition-colors">Henüz Kodunuz Yok mu? → <span className="text-white underline underline-offset-4">Yeni Cari Kaydı Al</span></Link>
        </div>
      </div>
    </div>
  );
}