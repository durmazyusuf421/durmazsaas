'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Building2, Rocket, Loader2, ArrowRight } from 'lucide-react';

export default function OnboardingSmartRouter() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  // State'ler
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Şirket Kurulum State'leri (Sadece şirket kurmamış toptancılara görünür)
  const [needsCompanySetup, setNeedsCompanySetup] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const autoRoute = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUserId(user.id);

        // 1. Kullanıcının Profilini Çek (Müşteri mi Toptancı mı?)
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_customer, global_cari_code')
          .eq('id', user.id)
          .single();

        if (profile?.is_customer) {
          // 🚀 MÜŞTERİ ROTASI: Şak diye Müşteri Merkezine gönder (Sıfır bekleme)
          router.push('/portal/customer-hub');
          return;
        } else {
          // 🚀 TOPTANCI ROTASI: Şirketi var mı diye kontrol et
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (company && company.name) {
            // Şirketi zaten var, direkt işletme paneline ışınla
            router.push(`/portal/${company.name}/business`);
          } else {
            // Şirketi YOK! Kurulum ekranını göster.
            setNeedsCompanySetup(true);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Yönlendirme Motoru Hatası:", error);
        setLoading(false);
      }
    };

    autoRoute();
  }, [router, supabase]);

  // Yeni Şirket Kurma İşlemi
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !userId) return;

    setIsSubmitting(true);
    try {
      // Şirketi veritabanına yaz
      const { error } = await supabase
        .from('companies')
        .insert([
          { 
            name: companyName.trim(),
            owner_id: userId 
          }
        ]);

      if (error) throw error;

      // Başarılı! İşletme paneline yönlendir.
      router.push(`/portal/${companyName.trim()}/business`);
    } catch (error: any) {
      alert("Şirket oluşturulurken hata oluştu: " + error.message);
      setIsSubmitting(false);
    }
  };

  // Eğer sistem arka planda yönlendirme yapıyorsa jilet gibi bir loading ekranı göster
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center selection:bg-[#3063E9]/30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3063E9]/10 blur-[150px] rounded-full pointer-events-none" />
        <Loader2 className="animate-spin text-[#3063E9] relative z-10" size={50} />
        <h2 className="text-xl font-black uppercase italic mt-6 relative z-10 text-white animate-pulse">Siber Yönlendirme Aktif...</h2>
        <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-2 uppercase relative z-10">Profiliniz analiz ediliyor</p>
      </div>
    );
  }

  // Eğer Toptancıysa ve Şirketi Yoksa (Kayıt Sonrası İlk Ekran)
  if (needsCompanySetup) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-[#3063E9]/30">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#3063E9]/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="w-full max-w-md bg-[#0F1219]/80 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[40px] shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[#3063E9] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/30">
              <Building2 size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-wide mb-2">İşletmenizi Kurun</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">B2B ağınızı yönetmeye başlamak için işletme adınızı belirleyin.</p>
          </div>

          <form onSubmit={handleCreateCompany} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Resmi İşletme / Toptancı Adı</label>
              <input 
                type="text" 
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Örn: Durmaz Toptan Gıda"
                className="w-full bg-[#020408] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-[#3063E9] focus:bg-white/5 transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !companyName.trim()}
              className="w-full py-5 bg-[#3063E9] disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(48,99,233,0.3)] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> KURULUYOR...</>
              ) : (
                <>SİSTEMİ BAŞLAT <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}