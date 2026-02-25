'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Mail, Lock, Building, MapPin, Hash, Phone, 
  ArrowRight, Loader2, Sparkles, ShieldCheck 
} from 'lucide-react';

export default function GlobalCustomerRegister() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    taxNo: '',
    taxOffice: '',
    address: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const generateCariCode = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `CARI-${randomNum}`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const newCariCode = generateCariCode();

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName } }
      });

      if (authError) throw authError;

      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            phone: formData.phone,
            tax_no: formData.taxNo,
            tax_office: formData.taxOffice,
            billing_address: formData.address,
            global_cari_code: newCariCode,
            is_customer: true 
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        setGeneratedCode(newCariCode);
      }
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (generatedCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-6 font-sans">
        <div className="bg-white max-w-md w-full p-10 rounded-[40px] text-center shadow-2xl border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#3063E9]"></div>
          
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Sparkles size={48} />
          </div>
          
          <h2 className="text-3xl font-black text-[#1B2559] mb-2 uppercase tracking-tighter">Pasaportunuz Hazır!</h2>
          <p className="text-gray-500 font-medium mb-8">İşte tüm toptancılarda geçerli Global Cari Kodunuz:</p>
          
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-3xl mb-8 relative">
            <span className="text-4xl font-black text-[#3063E9] tracking-[0.2em]">{generatedCode}</span>
          </div>
          
          <p className="text-sm text-gray-400 mb-8 font-medium">
            Bu kodu dükkan sahibine vererek sistemlerine anında kayıt olabilirsiniz.
          </p>
          
          {/* 🚀 ROTAYI DÜZELTTİK: Direkt Siber Merkeze Gider */}
          <button 
            onClick={() => router.push(`/portal/customer-hub`)} 
            className="w-full py-4 bg-[#1B2559] hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Siber Merkeze Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-4 py-12 font-sans">
      <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
        
        <div className="bg-[#1B2559] p-10 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 opacity-20 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <ShieldCheck size={56} className="mx-auto text-white mb-4 opacity-90" />
          <h1 className="text-3xl font-black uppercase tracking-tighter">Global Müşteri Kaydı</h1>
          <p className="text-blue-200 text-sm font-medium mt-2">Bilgilerinizi bir kez girin, tek kodla tüm piyasaya bağlanın.</p>
        </div>
        
        <form onSubmit={handleRegister} className="p-8 md:p-12 space-y-6">
          {error && <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold border border-red-100 text-center">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Fatura Başlığı / Şirket</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Building size={18} className="text-gray-400"/></div>
                <input required className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold text-[#1B2559]" placeholder="Örn: Kardeşler Market" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">E-Posta Adresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={18} className="text-gray-400"/></div>
                <input type="email" required className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold text-[#1B2559]" placeholder="ornek@mail.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Vergi No / TC No</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Hash size={18} className="text-gray-400"/></div>
                <input required className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold text-[#1B2559]" placeholder="11111111111" value={formData.taxNo} onChange={e => setFormData({...formData, taxNo: e.target.value})} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Vergi Dairesi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin size={18} className="text-gray-400"/></div>
                <input required className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold text-[#1B2559]" placeholder="Örn: Meram V.D." value={formData.taxOffice} onChange={e => setFormData({...formData, taxOffice: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Telefon</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone size={18} className="text-gray-400"/></div>
                <input required className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold text-[#1B2559]" placeholder="0555..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Portal Şifresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400"/></div>
                <input type="password" required minLength={6} className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold text-[#1B2559]" placeholder="En az 6 karakter" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Açık Fatura Adresi</label>
            <textarea required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold text-[#1B2559] h-28 resize-none" placeholder="Mahalle, sokak, no, ilçe/il..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>

          <button disabled={loading} className="w-full py-5 bg-[#3063E9] hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex justify-center items-center gap-2 active:scale-95 mt-4">
            {loading ? <Loader2 className="animate-spin" size={24} /> : <><Sparkles size={24} /> Bilgilerimi Kaydet ve Kodumu Al</>}
          </button>
          
          <div className="text-center pt-6">
            <p className="text-sm font-bold text-gray-400">Zaten global kodunuz var mı? <Link href="/portal" className="text-[#3063E9] hover:underline uppercase text-xs ml-2 tracking-widest">Giriş Yap</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}