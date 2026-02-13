'use client';
import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Save, Building, CreditCard, Phone, Mail, MapPin, Loader2, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Şirket Bilgileri State'i
  const [company, setCompany] = useState({
    id: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    bank_name: '',
    iban: ''
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // VERİLERİ ÇEK
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      
      if (profile?.company_id) {
        const { data: compData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();
          
        if (compData) {
          setCompany({
            id: compData.id,
            name: compData.name || '',
            address: compData.address || '',
            phone: compData.phone || '',
            email: compData.email || '',
            website: compData.website || '',
            bank_name: compData.bank_name || '',
            iban: compData.iban || ''
          });
        }
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // KAYDETME İŞLEMİ
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('companies')
      .update({
        name: company.name,
        address: company.address,
        phone: company.phone,
        email: company.email,
        website: company.website,
        bank_name: company.bank_name,
        iban: company.iban
      })
      .eq('id', company.id);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      alert("Bilgiler başarıyla güncellendi! 🎉");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* BAŞLIK */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2559]">Şirket Ayarları</h1>
        <p className="text-gray-500 text-sm">Fatura ve ekstrelerde görünecek bilgilerinizi buradan düzenleyin.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SOL KOLON: İletişim Bilgileri */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-[#1B2559] flex items-center gap-2 border-b pb-2 mb-4">
            <Building size={20} className="text-blue-600"/> Genel Bilgiler
          </h3>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Şirket Adı</label>
            <input required type="text" value={company.name} onChange={(e) => setCompany({...company, name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20 font-bold" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><MapPin size={14}/> Adres</label>
            <textarea rows={3} value={company.address} onChange={(e) => setCompany({...company, address: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20" placeholder="Mahalle, Cadde, No..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Phone size={14}/> Telefon</label>
              <input type="text" value={company.phone} onChange={(e) => setCompany({...company, phone: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20" placeholder="05..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Mail size={14}/> E-Posta</label>
              <input type="email" value={company.email} onChange={(e) => setCompany({...company, email: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20" placeholder="info@..." />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Globe size={14}/> Web Sitesi</label>
            <input type="text" value={company.website} onChange={(e) => setCompany({...company, website: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20" placeholder="www..." />
          </div>
        </div>

        {/* SAĞ KOLON: Banka Bilgileri */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-[#1B2559] flex items-center gap-2 border-b pb-2 mb-4">
              <CreditCard size={20} className="text-blue-600"/> Banka Bilgileri (IBAN)
            </h3>
            <p className="text-xs text-gray-400 mb-4">Bu bilgiler faturanın en altına eklenecektir.</p>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Banka Adı</label>
              <input type="text" value={company.bank_name} onChange={(e) => setCompany({...company, bank_name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20" placeholder="Örn: Ziraat Bankası" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">IBAN Numarası</label>
              <input type="text" value={company.iban} onChange={(e) => setCompany({...company, iban: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20 font-mono text-lg tracking-wider uppercase" placeholder="TR..." />
            </div>
          </div>

          {/* KAYDET BUTONU */}
          <button 
            type="submit"
            disabled={saving}
            className="w-full bg-[#3063E9] text-white py-4 rounded-xl font-bold hover:bg-[#2552D0] shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {saving ? "Güncelleniyor..." : "Ayarları Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}