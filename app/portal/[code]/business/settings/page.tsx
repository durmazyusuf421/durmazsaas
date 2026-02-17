'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, LogOut, 
  Loader2, Rocket, FileText, TrendingDown, Settings, 
  Building2, MapPin, CreditCard, Phone, UploadCloud, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function BusinessSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Ayarlar Form State
  const [formData, setFormData] = useState({
      name: '',
      phone: '',
      tax_office: '',
      tax_number: '',
      iban: '',
      address: ''
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    setLoading(true);
    try {
        let { data: compData } = await supabase.from('companies').select('*').eq('id', code).single();
        if (!compData) {
            const { data: nameData } = await supabase.from('companies').select('*').eq('name', code).single();
            compData = nameData;
        }

        if (compData) {
            setCompany(compData);
            setFormData({
                name: compData.name || '',
                phone: compData.phone || '',
                tax_office: compData.tax_office || '',
                tax_number: compData.tax_number || '',
                iban: compData.iban || '',
                address: compData.address || ''
            });
        }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { if (code) fetchData(); }, [code, supabase]);

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!company) return;
      setIsSaving(true);
      
      try {
          const { error } = await supabase
              .from('companies')
              .update({
                  name: formData.name,
                  phone: formData.phone,
                  tax_office: formData.tax_office,
                  tax_number: formData.tax_number,
                  iban: formData.iban,
                  address: formData.address
              })
              .eq('id', company.id);

          if (error) {
              // Eğer veritabanında bu sütunlar yoksa uyarı ver
              alert("Hata! (Eğer tablonuzda tax_office, iban gibi sütunlar yoksa Supabase'den eklemelisiniz.)\nDetay: " + error.message);
          } else {
              alert("Şirket Bilgileri Başarıyla Güncellendi! ✅");
              // URL isimle çalışıyorsa ve isim değiştiyse yeni URL'ye yönlendir
              if (formData.name !== code && company.id !== code) {
                  router.push(`/portal/${formData.name}/business/settings`);
              } else {
                  fetchData();
              }
          }
      } catch (err: any) {
          alert("Hata: " + err.message);
      } finally {
          setIsSaving(false);
      }
  };

  if (loading) return (
    <div className="h-screen bg-[#0B0E14] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-gray-400" size={50} />
      <p className="text-gray-500 font-black uppercase tracking-widest text-xs mt-4">Sistem Ayarları Çekiliyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex font-sans selection:bg-[#3063E9]/30 overflow-x-hidden">
      
      {/* --- STANDART SIDEBAR --- */}
      <aside className="fixed top-0 left-0 h-full w-72 bg-[#0F1219] border-r border-white/5 p-8 flex flex-col z-[70] hidden lg:flex shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3063E9] to-[#BC13FE] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(48,99,233,0.3)]">
              <Rocket size={26} className="text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter uppercase italic">Durmaz<span className="text-[#3063E9]">SaaS</span></span>
              <p className="text-[8px] font-black text-[#BC13FE] uppercase tracking-[0.3em]">Business Intelligence</p>
            </div>
        </div>
        <nav className="space-y-2 flex-1">
          <Link href={`/portal/${code}/business`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><LayoutDashboard size={20} className="group-hover:text-[#3063E9]"/> Komuta Merkezi</Link>
          <Link href={`/portal/${code}/business/products`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Package size={20} className="group-hover:text-[#3063E9]" /> Ürün Yönetimi</Link>
          <Link href={`/portal/${code}/business/orders`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><ShoppingCart size={20} className="group-hover:text-[#3063E9]" /> Gelen Siparişler</Link>
          <Link href={`/portal/${code}/business/invoices`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><FileText size={20} className="group-hover:text-[#3063E9]" /> Fatura Yönetimi</Link>
          <Link href={`/portal/${code}/business/customers`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><Users size={20} className="group-hover:text-[#3063E9]" /> Bayi Ağı</Link>
          <Link href={`/portal/${code}/business/expenses`} className="w-full flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all group"><TrendingDown size={20} className="group-hover:text-red-500 transition-colors" /> Gider Takibi</Link>
          
          {/* AKTİF BUTON: AYARLAR */}
          <div className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-gray-500/10 to-transparent border-l-4 border-gray-400 text-white rounded-r-xl font-bold shadow-lg mt-4">
            <Settings size={20} className="text-gray-400"/> Sistem Ayarları
          </div>
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/portal'))} className="flex items-center gap-4 px-5 py-4 text-red-500/50 hover:text-red-500 border border-red-500/10 rounded-xl font-bold transition-all mt-auto group"><LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Güvenli Çıkış</button>
      </aside>

      {/* --- ANA İÇERİK --- */}
      <main className="flex-1 lg:ml-72 p-4 md:p-10 space-y-8">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0F1219] p-8 rounded-[40px] border border-white/5 shadow-lg">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#0B0E14] rounded-2xl border border-white/5"><Settings className="text-gray-400" size={28} /></div>
            <div>
                <h2 className="text-2xl font-black tracking-tight uppercase italic text-white">Sistem Ayarları</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">İşletme Profili ve Resmi Bilgiler</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-[#0B0E14] px-6 py-4 rounded-3xl border border-white/5">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Veritabanı Güvende</span>
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">Cari Kod: <span className="text-gray-300">{code.toUpperCase()}</span></span>
            </div>
          </div>
        </div>

        {/* AYARLAR FORMU */}
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SOL KOLON: LOGO VE TEMEL BİLGİLER */}
            <div className="lg:col-span-1 space-y-8">
                {/* Logo Yükleme Alanı */}
                <div className="bg-[#0F1219] p-8 rounded-[40px] border border-white/5 shadow-lg flex flex-col items-center justify-center text-center group cursor-pointer hover:border-[#3063E9]/30 transition-all">
                    <div className="w-32 h-32 bg-[#0B0E14] border border-dashed border-gray-600 rounded-full flex flex-col items-center justify-center mb-6 group-hover:border-[#3063E9] transition-colors relative overflow-hidden">
                        <UploadCloud size={32} className="text-gray-500 group-hover:text-[#3063E9] mb-2 transition-colors" />
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Logo Yükle</span>
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Şirket Logosu</h3>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-2">Önerilen boyut: 500x500px (PNG)</p>
                </div>

                {/* Temel Bilgiler */}
                <div className="bg-[#0F1219] p-8 rounded-[40px] border border-white/5 shadow-lg space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-white mb-6"><Building2 className="text-[#BC13FE]" size={18}/> Şirket Künyesi</h3>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">İşletme Adı (Cari İsim)</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0B0E14] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-[#BC13FE] outline-none transition-all uppercase placeholder:text-gray-800 text-white" placeholder="ÖRN: DURMAZ GIDA LTD. ŞTİ." />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Kurumsal İletişim (Telefon)</label>
                        <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#0B0E14] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-[#BC13FE] outline-none transition-all placeholder:text-gray-800 text-white" placeholder="05XX XXX XX XX" />
                    </div>
                </div>
            </div>

            {/* SAĞ KOLON: FİNANS VE ADRES BİLGİLERİ */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-[#0F1219] p-10 rounded-[40px] border border-white/5 shadow-lg space-y-8">
                    
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-white border-b border-white/5 pb-6"><CreditCard className="text-green-500" size={18}/> Finans ve Fatura Bilgileri</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Vergi Dairesi</label>
                            <input type="text" value={formData.tax_office} onChange={(e) => setFormData({...formData, tax_office: e.target.value})} className="w-full bg-[#0B0E14] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-green-500 outline-none transition-all uppercase placeholder:text-gray-800 text-white" placeholder="ÖRN: MARMARA V.D." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Vergi / TC Kimlik No</label>
                            <input type="text" value={formData.tax_number} onChange={(e) => setFormData({...formData, tax_number: e.target.value})} className="w-full bg-[#0B0E14] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-green-500 outline-none transition-all placeholder:text-gray-800 text-white" placeholder="11111111111" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Kurumsal IBAN Adresi (Tahsilat İçin)</label>
                        <input type="text" value={formData.iban} onChange={(e) => setFormData({...formData, iban: e.target.value})} className="w-full bg-[#0B0E14] border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-green-500 outline-none transition-all uppercase placeholder:text-gray-800 text-white" placeholder="TR00 0000 0000 0000 0000 0000 00" />
                    </div>

                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-white border-b border-white/5 pb-6 pt-6"><MapPin className="text-[#3063E9]" size={18}/> Merkez Açık Adres</h3>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.1em] ml-1">Fatura Adresi</label>
                        <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows={4} className="w-full bg-[#0B0E14] border border-white/10 rounded-3xl px-6 py-5 text-sm font-bold focus:border-[#3063E9] outline-none transition-all uppercase placeholder:text-gray-800 text-white resize-none custom-scrollbar" placeholder="MAHALLE, SOKAK, BİNA NO, İLÇE/İL"></textarea>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={isSaving} className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                            {isSaving ? <Loader2 size={22} className="animate-spin" /> : <CheckCircle2 size={22} />} Sistemi Güncelle ve Kaydet
                        </button>
                    </div>

                </div>
            </div>

        </form>

      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}} />
    </div>
  );
}