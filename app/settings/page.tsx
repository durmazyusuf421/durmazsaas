'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Save, Building, Phone, Mail, MapPin, FileText } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>({
    id: null,
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_office: '',
    tax_number: ''
  });

  useEffect(() => {
    getCompanyInfo();
  }, []);

  async function getCompanyInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Profil tablosundan Şirket ID'sini bul
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.company_id) {
        console.error('Şirket ID bulunamadı. Lütfen SQL Policy ayarlarını kontrol edin.');
        return;
      }

      // 2. Şirket detaylarını çek
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();
      
      if (companyData) {
        setCompany(companyData);
      } else {
        // Veri yoksa bile ID'yi kaybetme
        setCompany((prev: any) => ({ ...prev, id: profile.company_id }));
      }

    } catch (error) {
      console.error('Hata:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (!company.id) {
      alert("Hata: Şirket kimliği (ID) yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('companies')
      .update({
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        tax_office: company.tax_office,
        tax_number: company.tax_number
      })
      .eq('id', company.id);

    if (!error) {
      alert("Şirket bilgileri başarıyla güncellendi! ✅");
    } else {
      alert("Kaydetme Hatası: " + error.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Şirket bilgileri yükleniyor...</div>;

  return (
    <div className="p-8 ml-64 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Şirket Ayarları</h1>
      <p className="text-slate-500 mb-8">Fatura ve raporlarda görünecek şirket bilgilerinizi düzenleyin.</p>

      <div className="max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <form onSubmit={handleSave} className="p-8 space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Building size={16}/> Şirket Ünvanı
            </label>
            <input 
              className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
              value={company.name}
              onChange={(e) => setCompany({...company, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Phone size={16}/> Telefon
              </label>
              <input 
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0212 ..."
                value={company.phone || ''}
                onChange={(e) => setCompany({...company, phone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail size={16}/> E-posta
              </label>
              <input 
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="info@sirket.com"
                value={company.email || ''}
                onChange={(e) => setCompany({...company, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MapPin size={16}/> Açık Adres
            </label>
            <textarea 
              rows={3}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Şirket adresi..."
              value={company.address || ''}
              onChange={(e) => setCompany({...company, address: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
             <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileText size={16}/> Vergi Dairesi
              </label>
              <input 
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={company.tax_office || ''}
                onChange={(e) => setCompany({...company, tax_office: e.target.value})}
              />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileText size={16}/> Vergi Numarası
              </label>
              <input 
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={company.tax_number || ''}
                onChange={(e) => setCompany({...company, tax_number: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-70"
            >
              <Save size={20}/> {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}