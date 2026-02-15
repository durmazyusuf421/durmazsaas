'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowRight, Loader2, ShoppingBag, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function CustomerLogin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    try {
      // Girilen Cari Kod veritabanında var mı kontrol et
      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('current_cari_code')
        .eq('current_cari_code', code.trim().toUpperCase())
        .single();

      if (fetchError || !data) {
        throw new Error("Geçersiz Cari Kod! Lütfen işletmenizden aldığınız kodu kontrol edin.");
      }

      // Kod doğruysa müşteriyi kendi özel vitrinine şutla!
      router.push(`/portal/${code.trim().toUpperCase()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden">
        
        <div className="bg-[#1B2559] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-20 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShoppingBag size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Müşteri Portalı</h2>
          <p className="text-blue-200 text-sm font-medium mt-1">İşletmenizin size verdiği Cari Kod ile giriş yapın.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold mb-6 text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleCustomerLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cari Kodunuz</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound size={20} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#3063E9] focus:bg-white transition-all font-black text-[#1B2559] uppercase tracking-widest text-lg"
                  placeholder="Örn: CUS-XXXX"
                  value={code} 
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[#3063E9] hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 transition-all flex justify-center items-center gap-2 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <><ArrowRight size={24} /> Portala Gir</>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#1B2559] transition-colors">
              <Building2 size={16} /> İşletme misiniz? Ana Sayfaya Dön
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}