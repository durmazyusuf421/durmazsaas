'use client';
import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Building2, Users, ArrowRight, Loader2, CheckCircle2, ChevronLeft } from 'lucide-react';

export default function OnboardingPage() {
  const [step, setStep] = useState<'choice' | 'join'>('choice');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 6 HANELİ KOD İLE KATILMA MANTIĞI
  const handleJoinCompany = async () => {
    if (code.length !== 6) return alert("Lütfen 6 haneli kodu girin.");
    setLoading(true);

    try {
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('join_code', code)
        .limit(1);

      if (companyError || !companies?.length) {
        alert("Geçersiz kod! Lütfen yöneticinizden doğru kodu alın.");
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ company_id: companies[0].id })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Oturumu tazele ve yönlendir
      await supabase.auth.refreshSession();
      alert(`${companies[0].name} işletmesine başarıyla katıldınız!`);
      window.location.href = '/dashboard';

    } catch (err: any) {
      alert("Hata: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F4F7FE] p-6">
      <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 w-full max-w-lg text-center border border-white">
        
        {/* LOGO BÖLÜMÜ */}
        <div className="mb-10">
          <div className="bg-[#3063E9] w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
            <Building2 className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-[#1B2559] tracking-tight">Durmaz SaaS</h1>
          <p className="text-slate-400 font-medium mt-2">İşletmenizi yönetmeye hazır mısınız?</p>
        </div>

        {step === 'choice' ? (
          /* SEÇENEK EKRANI */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. SEÇENEK: İŞLETME KUR (YENİ ADRESE GİDER) */}
            <button 
              onClick={() => window.location.href = '/onboarding/create'}
              className="w-full bg-[#3063E9] text-white py-6 rounded-2xl font-bold text-lg hover:bg-[#2552D0] transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 group"
            >
              Kendi İşletmemi Kurmak İstiyorum
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-300 font-bold tracking-widest">veya</span></div>
            </div>

            {/* 2. SEÇENEK: KOD İLE BAĞLAN */}
            <button 
              onClick={() => setStep('join')}
              className="w-full bg-white text-[#1B2559] py-6 rounded-2xl font-bold text-lg border-2 border-[#E0E5F2] hover:border-[#3063E9] hover:bg-blue-50/30 transition-all flex items-center justify-center gap-3"
            >
              <Users size={20} />
              Bir İşletmeye Bağlanmak İstiyorum
            </button>
          </div>
        ) : (
          /* KOD GİRİŞ EKRANI */
          <div className="animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setStep('choice')} 
              className="flex items-center gap-2 text-[#3063E9] font-bold text-sm mb-8 hover:opacity-75 transition mx-auto"
            >
              <ChevronLeft size={18} /> SEÇİM EKRANINA DÖN
            </button>

            <h2 className="text-xl font-bold text-[#1B2559] mb-4 text-left px-2">Katılım Kodunu Girin</h2>
            
             <input 
              type="text"
              maxLength={6}
              placeholder="000000"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
              className="w-full bg-[#F4F7FE] text-center text-5xl tracking-[0.8rem] font-black p-8 border-2 border-transparent focus:border-[#3063E9] rounded-[2rem] outline-none mb-8 transition-all text-[#1B2559] placeholder:text-blue-100"
            />

            <button 
              onClick={handleJoinCompany}
              disabled={loading || code.length !== 6}
              className="w-full bg-[#3063E9] text-white py-6 rounded-2xl font-bold text-xl hover:bg-[#2552D0] transition-all disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
              {loading ? "Doğrulanıyor..." : "Kodu Doğrula ve Katıl"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}