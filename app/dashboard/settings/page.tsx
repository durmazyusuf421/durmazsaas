'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Building2, CreditCard, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [settings, setSettings] = useState({
    name: '',
    bank_name: '',
    iban: '',
    account_holder: ''
  });

  const [companyId, setCompanyId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
        if (!profile?.company_id) return;
        
        setCompanyId(profile.company_id);

        const { data: company } = await supabase
          .from('companies')
          .select('name, bank_name, iban, account_holder')
          .eq('id', profile.company_id)
          .single();

        if (company) {
          setSettings({
            name: company.name || '',
            bank_name: company.bank_name || '',
            iban: company.iban || '',
            account_holder: company.account_holder || ''
          });
        }
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: settings.name,
          bank_name: settings.bank_name,
          iban: settings.iban,
          account_holder: settings.account_holder
        })
        .eq('id', companyId);

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // 3 saniye sonra yeşil tik kaybolur
    } catch (error: any) {
      alert("Kaydederken bir hata oluştu: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-8 text-[#1B2559]">
      <div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">İşletme Ayarları</h1>
        <p className="text-gray-400 font-medium mt-1">Dükkanınızın vitrinini ve vezne bilgilerini buradan yönetin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 🏢 GENEL BİLGİLER KARTI */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
              <Building2 size={24} />
            </div>
            <h2 className="text-xl font-bold">Genel Bilgiler</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">İşletme / Dükkan Adı</label>
              <input 
                type="text" 
                value={settings.name}
                onChange={(e) => setSettings({...settings, name: e.target.value})}
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-blue-500 font-bold transition-all"
                placeholder="Örn: Durmaz Toptan Gıda"
              />
            </div>
            {/* İleride buraya Logo Yükleme alanı da ekleyebiliriz Patron */}
          </div>
        </div>

        {/* 💳 BANKA VE IBAN KARTI */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="bg-green-50 p-3 rounded-2xl text-green-600">
              <CreditCard size={24} />
            </div>
            <h2 className="text-xl font-bold">Ödeme & Banka (Vezne)</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Banka Adı</label>
              <input 
                type="text" 
                value={settings.bank_name}
                onChange={(e) => setSettings({...settings, bank_name: e.target.value})}
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-green-500 font-bold transition-all"
                placeholder="Örn: Ziraat Bankası"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Alıcı Adı / Hesap Sahibi</label>
              <input 
                type="text" 
                value={settings.account_holder}
                onChange={(e) => setSettings({...settings, account_holder: e.target.value})}
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-green-500 font-bold transition-all"
                placeholder="Örn: Yusuf Durmaz"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">IBAN Numarası</label>
              <input 
                type="text" 
                value={settings.iban}
                onChange={(e) => setSettings({...settings, iban: e.target.value})}
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-green-500 font-mono font-bold tracking-wider transition-all"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
              />
            </div>
          </div>
        </div>

      </div>

      {/* 🚀 KAYDET BUTONU */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#3063E9] hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-70"
        >
          {saving ? <Loader2 size={24} className="animate-spin" /> : success ? <><CheckCircle2 size={24} /> Kaydedildi!</> : <><Save size={24} /> Ayarları Kaydet</>}
        </button>
      </div>

    </div>
  );
}