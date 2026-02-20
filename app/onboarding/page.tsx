'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Users, Rocket, ArrowRight, Loader2, ShieldCheck 
} from 'lucide-react';

export default function Onboarding() {
  const router = useRouter();
  const [loadingType, setLoadingType] = useState<'business' | 'customer' | null>(null);

  const handleSelection = (type: 'business' | 'customer') => {
    setLoadingType(type);
    
    // Yönlendirme simülasyonu (Senin kendi rotalarına göre burayı ayarlayabilirsin)
    setTimeout(() => {
      if (type === 'business') {
        // Yeni şirket kurma veya işletme paneline gitme rotası
        router.push('/onboarding/business'); // Kendi şirket kurma sayfana yönlendir
      } else {
        // Müşteri paneline (Customer Hub) gitme rotası
        router.push('/portal/customer-hub'); 
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#3063E9]/30 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* SİBER ARKA PLAN EFEKTLERİ */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#3063E9]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
      
      {/* ANA KART */}
      <div className="w-full max-w-2xl bg-[#0F1219]/80 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[40px] shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* LOGO VE BAŞLIK */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-[#3063E9] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/30">
            <Rocket size={40} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-wide mb-2">Durmaz<span className="text-[#3063E9]">SaaS</span></h1>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Siber Evrene Hoş Geldiniz. Yolunuzu Seçin.</p>
        </div>

        {/* SEÇENEKLER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* SEÇENEK 1: İŞLETME KUR */}
          <button 
            onClick={() => handleSelection('business')}
            disabled={loadingType !== null}
            className={`group text-left p-8 rounded-[32px] border transition-all duration-300 relative overflow-hidden
              ${loadingType === 'business' 
                ? 'bg-[#3063E9] border-[#3063E9]' 
                : 'bg-white/5 border-white/10 hover:border-[#3063E9]/50 hover:bg-[#0B0E14]'
              }
              ${loadingType === 'customer' ? 'opacity-50 grayscale' : 'opacity-100'}
            `}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300
              ${loadingType === 'business' ? 'bg-white/20' : 'bg-[#3063E9]/20 text-[#3063E9] group-hover:scale-110'}
            `}>
              {loadingType === 'business' ? <Loader2 size={28} className="animate-spin text-white" /> : <Building2 size={28} />}
            </div>
            <h3 className={`text-xl font-black uppercase mb-2 ${loadingType === 'business' ? 'text-white' : 'text-white'}`}>
              İşletmemi Kur
            </h3>
            <p className={`text-xs font-bold leading-relaxed ${loadingType === 'business' ? 'text-white/80' : 'text-gray-500'}`}>
              Kendi B2B ağımı kurmak, toptan satış yapmak ve bayilerimi yönetmek istiyorum.
            </p>
            
            <div className={`absolute bottom-8 right-8 transition-all duration-300 ${loadingType === 'business' ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}>
                <ArrowRight size={24} className={loadingType === 'business' ? 'text-white' : 'text-[#3063E9]'} />
            </div>
          </button>

          {/* SEÇENEK 2: MÜŞTERİ OL / AĞA KATIL */}
          <button 
            onClick={() => handleSelection('customer')}
            disabled={loadingType !== null}
            className={`group text-left p-8 rounded-[32px] border transition-all duration-300 relative overflow-hidden
              ${loadingType === 'customer' 
                ? 'bg-purple-600 border-purple-600' 
                : 'bg-white/5 border-white/10 hover:border-purple-600/50 hover:bg-[#0B0E14]'
              }
              ${loadingType === 'business' ? 'opacity-50 grayscale' : 'opacity-100'}
            `}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300
              ${loadingType === 'customer' ? 'bg-white/20' : 'bg-purple-600/20 text-purple-500 group-hover:scale-110'}
            `}>
              {loadingType === 'customer' ? <Loader2 size={28} className="animate-spin text-white" /> : <Users size={28} />}
            </div>
            <h3 className={`text-xl font-black uppercase mb-2 ${loadingType === 'customer' ? 'text-white' : 'text-white'}`}>
              Bir Ağa Katıl
            </h3>
            <p className={`text-xs font-bold leading-relaxed ${loadingType === 'customer' ? 'text-white/80' : 'text-gray-500'}`}>
              Bir toptancının bayisi olmak, sipariş vermek ve ekstrelerimi takip etmek istiyorum.
            </p>

            <div className={`absolute bottom-8 right-8 transition-all duration-300 ${loadingType === 'customer' ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}>
                <ArrowRight size={24} className={loadingType === 'customer' ? 'text-white' : 'text-purple-500'} />
            </div>
          </button>

        </div>

        {/* ALT GÜVENLİK İBARESİ */}
        <div className="mt-10 flex items-center justify-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <ShieldCheck size={14} className="text-green-500" />
            End-to-End Encrypted System
        </div>

      </div>
    </div>
  );
}