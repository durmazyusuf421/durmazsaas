'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Building2, Wallet, Loader2, Rocket, AlertTriangle, ArrowRight, CheckCircle2, LogOut
} from 'lucide-react';

export default function CustomerHub() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [linkedCompanies, setLinkedCompanies] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [debugError, setDebugError] = useState<string | null>(null); // SİBER TEŞHİS İÇİN EKLENDİ

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        // 1. PROFİLİ ÇEK VE HATA VARSA EKRANA YANSIT
        const { data: userProfile, error: pError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        
        if (pError) {
            setDebugError(`Profil Çekme Hatası: ${pError.message}`);
            return;
        }
        
        if (!userProfile) {
            setDebugError(`Profil Bulunamadı! Sistemde bu kullanıcı ID'sine (${user.id}) ait profil satırı yok.`);
            return;
        }

        setProfile(userProfile);

        // 2. KOD YOKSA DURDUR
        if (!userProfile?.global_cari_code || userProfile.global_cari_code.trim() === '') {
            setLoading(false);
            return;
        }

        const cariCode = userProfile.global_cari_code.trim();

        // 3. EŞLEŞEN İŞLETMELERİ BUL
        const { data: customersData, error: custError } = await supabase
          .from('customers')
          .select('id, company_id, balance, status, companies!inner(name)')
          .eq('code', cariCode);

        if (custError) {
            setDebugError(`Müşteri Tablosu Hatası: ${custError.message}`);
            return;
        }

        if (customersData && customersData.length > 0) {
          const formattedCompanies = customersData.map((c: any) => {
              let compName = 'Bilinmeyen İşletme';
              if (c.companies) {
                  compName = Array.isArray(c.companies) ? (c.companies[0]?.name || compName) : (c.companies?.name || compName);
              }

              return {
                  id: c.id,
                  company_id: c.company_id,
                  company_name: compName,
                  company_slug: compName, 
                  balance: Number(c.balance) || 0,
                  status: c.status
              };
          });
          
          setLinkedCompanies(formattedCompanies);

          const customerIds = formattedCompanies.map(c => c.id);
          if (customerIds.length > 0) {
              const { data: invoicesData } = await supabase
                .from('invoices')
                .select('id, invoice_no, total_amount')
                .in('customer_id', customerIds)
                .eq('status', 'Müşteri Onayı Bekliyor');

              if (invoicesData) setPendingInvoices(invoicesData);
          }
        }
      } catch (e: any) { 
          setDebugError(`Kritik Sistem Hatası: ${e.message}`);
      } finally { 
          setLoading(false); 
      }
    };
    fetchCustomerData();
  }, [router, supabase]);

  const totalDebt = linkedCompanies.reduce((acc, curr) => acc + (curr.balance || 0), 0);

  if (loading) return <div className="h-screen bg-[#0B0E14] flex items-center justify-center"><Loader2 className="animate-spin text-[#3063E9]" size={50} /></div>;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#3063E9]/30 p-6 md:p-10">
      
      {/* 🔴 SİBER TEŞHİS EKRANI (Hata varsa görünür) */}
      {debugError && (
          <div className="max-w-6xl mx-auto mb-8 p-6 bg-red-500/10 border border-red-500/50 rounded-2xl">
              <h3 className="text-red-500 font-black uppercase flex items-center gap-2 mb-2"><AlertTriangle /> SİBER TEŞHİS UYARISI</h3>
              <p className="text-sm font-bold text-white/80">{debugError}</p>
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg font-bold text-xs">Çıkış Yap ve Yeniden Gir</button>
          </div>
      )}

      {/* ÜST BAR */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-white/5 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#3063E9] rounded-2xl flex items-center justify-center shadow-lg"><Rocket size={24} /></div>
          <div><h2 className="text-2xl font-black uppercase italic leading-none">Müşteri Merkezi</h2><p className="text-[10px] text-[#3063E9] font-bold tracking-widest mt-1">Siber Kontrol Paneli</p></div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto justify-end">
          <div className="text-right">
            <p className="text-xs font-black uppercase">{profile?.full_name || 'İSİMSİZ PROFİL'}</p>
            <p className="text-[10px] text-[#3063E9] font-black tracking-widest">{profile?.global_cari_code || 'KOD YOK'}</p>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"><LogOut size={18} /></button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SOL KOLON */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0F1219] border border-white/5 p-8 rounded-[32px] group hover:border-[#3063E9]/30 transition-all">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 bg-[#3063E9]/20 rounded-xl flex items-center justify-center text-[#3063E9]"><Wallet size={20} /></div>
                    <h3 className="text-sm font-black uppercase text-gray-400">Toplam Borç Bakiye</h3>
                </div>
                <p className="text-4xl font-black italic text-white relative z-10">{totalDebt.toLocaleString('tr-TR')} <span className="text-xl text-[#3063E9] not-italic">₺</span></p>
            </div>
            <div className={`border p-6 rounded-[32px] transition-all ${pendingInvoices.length > 0 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
                {pendingInvoices.length > 0 ? (
                    <><div className="flex items-center gap-3 mb-4"><AlertTriangle className="text-orange-500" size={24} /><h3 className="text-sm font-black text-orange-500 uppercase">İşlem Bekliyor</h3></div><p className="text-xs font-bold text-gray-400 mb-6"><span className="text-white">{pendingInvoices.length} adet</span> yeni ekstre var.</p></>
                ) : (
                    <><div className="flex items-center gap-3 mb-4"><CheckCircle2 className="text-green-500" size={24} /><h3 className="text-sm font-black text-green-500 uppercase">İşlemler Tamam</h3></div><p className="text-xs font-bold text-gray-400">Bekleyen onay yok.</p></>
                )}
            </div>
        </div>

        {/* SAĞ KOLON: İŞLETMELER */}
        <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-black uppercase flex items-center gap-3"><Building2 className="text-[#3063E9]" /> Bağlı Olduğum İşletmeler</h3>
            {linkedCompanies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {linkedCompanies.map((company) => (
                        <div key={company.id} className="bg-[#0F1219] border border-white/5 p-6 rounded-[32px] flex flex-col justify-between group hover:border-[#3063E9]/40 transition-all">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-[#3063E9]/20 group-hover:text-[#3063E9] transition-all"><Building2 size={20} /></div>
                                    <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-[8px] font-black uppercase">Aktif Ağ</span>
                                </div>
                                <h4 className="text-lg font-black uppercase mb-1">{company.company_name}</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Bakiye: <span className={company.balance < 0 ? 'text-red-500' : 'text-white'}>{company.balance.toLocaleString('tr-TR')} ₺</span></p>
                            </div>
                            <button onClick={() => router.push(`/portal/${company.company_slug}/customer/orders`)} className="mt-6 w-full py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 group-hover:bg-[#3063E9] transition-all">
                                İşletme Portalına Gir <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-[#0F1219] border border-white/5 p-10 rounded-[32px] text-center opacity-50">
                    <Building2 size={48} className="mx-auto mb-4 text-gray-600" />
                    <h4 className="text-sm font-black uppercase mb-2">Henüz Bir Ağa Bağlı Değilsiniz</h4>
                    <p className="text-xs font-bold text-gray-500">
                        {profile?.global_cari_code ? `Cari kodunuz (${profile.global_cari_code}) henüz bir işletme tarafından eklenmemiş.` : 'Lütfen profilinizden cari kodunuzu oluşturun.'}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}