'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { Hexagon, Mail, Lock, User, Building2, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Supabase'e Kayıt İsteği Gönder
    // BURASI ÇOK ÖNEMLİ: 'options' içindeki veriler SQL Trigger'ımızı tetikleyecek!
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          company_name: formData.companyName, // SQL burayı okuyup şirket oluşturacak
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  // Başarılı Kayıt Sonrası Mesajı
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a] p-4">
         <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-10 shadow-2xl text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Kayıt Başarılı!</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
               Tebrikler, <strong>{formData.companyName}</strong> hesabı oluşturuldu. <br/>
               Lütfen e-posta adresinizi doğrulayın ve giriş yapın.
            </p>
            <Link href="/login" className="block w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-black text-lg uppercase tracking-widest hover:opacity-90 transition-all">
               GİRİŞ YAP
            </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a] p-4 relative overflow-hidden">
      
      {/* Arkaplan Efektleri */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
        
        {/* Başlık */}
        <div className="text-center mb-8">
           <div className="inline-flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg text-white"><Hexagon size={24} fill="currentColor"/></div>
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">DURMAZSAAS</span>
           </div>
           <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Şirket Hesabı Oluştur</h1>
           <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-sm">30 gün ücretsiz deneyin, kredi kartı gerekmez.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
           
           <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Ad Soyad</label>
                  <div className="relative">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><User size={18}/></div>
                     <input type="text" required placeholder="Adınız"
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 transition-all placeholder-slate-400 text-sm"
                       value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                  </div>
               </div>
               <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Şirket Ünvanı</label>
                  <div className="relative">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Building2 size={18}/></div>
                     <input type="text" required placeholder="Örn: Durmaz Ltd."
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 transition-all placeholder-slate-400 text-sm"
                       value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} />
                  </div>
               </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">E-Posta Adresi</label>
              <div className="relative">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={18}/></div>
                 <input type="email" required placeholder="sirket@mail.com"
                   className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 transition-all placeholder-slate-400 text-sm"
                   value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Parola Oluştur</label>
              <div className="relative">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18}/></div>
                 <input type="password" required placeholder="En az 6 karakter" minLength={6}
                   className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 transition-all placeholder-slate-400 text-sm"
                   value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
           </div>

           {error && (
             <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                ⚠️ {error}
             </div>
           )}

           <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2">
             {loading ? <Loader2 className="animate-spin"/> : <>HESABI OLUŞTUR <ArrowRight size={20}/></>}
           </button>

        </form>

        <div className="mt-6 text-center border-t border-slate-200 dark:border-slate-800 pt-6">
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              Zaten hesabınız var mı? {' '}
              <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                 Giriş Yapın
              </Link>
           </p>
        </div>

      </div>
    </div>
  );
}