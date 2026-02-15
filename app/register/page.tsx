'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Building, MapPin, Hash, ArrowRight, Loader2, Sparkles } from 'lucide-react';

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
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Rastgele Benzersiz Cari Kod Oluşturma (Örn: DRMZ-4582)
  const generateCariCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `CARI-${randomNum}`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const newCariCode = generateCariCode();

    try {
      // 1. Kullanıcıyı Kaydet
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName } }
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 2. Profilini Global Bilgilerle Güncelle
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
        alert(`Kayıt Başarılı! Global Cari Kodunuz: ${newCariCode}. Bu kodla tüm işletmelere kayıt olabilirsiniz.`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (generatedCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-6">
        <div className="bg-white max-w-md w-full p-10 rounded-[40px] text-center shadow-2xl border-4 border-[#3063E9]">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles size={40} />
          </div>
          <h2 className="text-3xl font-black text-[#1B2559] mb-2 uppercase tracking-tighter">Pasaportunuz Hazır!</h2>
          <p className="text-gray-500 font-medium mb-8">İşte tüm işletmelerde geçerli Global Cari Kodunuz:</p>
          <div className="bg-gray-100 p-6 rounded-3xl mb-8">
            <span className="text-4xl font-black text-[#3063E9] tracking-[0.2em]">{generatedCode}</span>
          </div>
          <p className="text-sm text-gray-400 mb-8 font-medium">Bu kodu toptancınıza vererek sistemlerine anında kayıt olabilirsiniz.</p>
          <button onClick={() => router.push('/portal')} className="w-full py-4 bg-[#1B2559] text-white rounded-2xl font-bold uppercase tracking-widest">Giriş Yap</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-4 py-20">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden">
        <div className="bg-[#1B2559] p-8 text-center text-white">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Global Müşteri Kaydı</h1>
          <p className="text-blue-200 text-sm font-medium mt-1">Bilgilerini gir, tek kodla tüm piyasaya bağlan.</p>
        </div>
        
        <form onSubmit={handleRegister} className="p-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Fatura Başlığı / Ad Soyad</label><input required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold" onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">E-Posta</label><input type="email" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold" onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vergi / TC No</label><input required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold" onChange={e => setFormData({...formData, taxNo: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vergi Dairesi</label><input required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold" onChange={e => setFormData({...formData, taxOffice: e.target.value})} /></div>
          </div>

          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Fatura Adresi</label><textarea required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold h-24" onChange={e => setFormData({...formData, address: e.target.value})} /></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Telefon</label><input required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold" onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Şifre</label><input type="password" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-[#3063E9] border border-transparent font-bold" onChange={e => setFormData({...formData, password: e.target.value})} /></div>
          </div>

          <button disabled={loading} className="w-full py-5 bg-[#3063E9] hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles /> Bilgilerimi Kaydet ve Kodumu Al</>}
          </button>
        </form>
      </div>
    </div>
  );
}