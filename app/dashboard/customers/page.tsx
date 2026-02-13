'use client';
import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Filter, Plus, Phone, Mail, User, MapPin, X, Loader2 } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Yeni Müşteri Formu
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Müşterileri Çek
  const fetchCustomers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Önce kullanıcının şirket ID'sini bul
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    
    if (profile?.company_id) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });
      
      if (data) setCustomers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Müşteri Kaydet
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Şirket ID'yi tekrar bul (Güvenlik için)
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single();

    if (profile?.company_id) {
      const { error } = await supabase.from('customers').insert([
        { ...newCustomer, company_id: profile.company_id }
      ]);

      if (!error) {
        setIsModalOpen(false);
        setNewCustomer({ name: '', phone: '', email: '', address: '' }); // Formu temizle
        fetchCustomers(); // Listeyi yenile
      } else {
        alert("Hata: " + error.message);
      }
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 relative">
      {/* ÜST BAŞLIK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2559]">Müşteriler</h1>
          <p className="text-gray-500 text-sm">Toplam {customers.length} kayıtlı müşteriniz var.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#3063E9] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2552D0] transition-all shadow-lg shadow-blue-500/30"
        >
          <Plus size={20} />
          Yeni Müşteri Ekle
        </button>
      </div>

      {/* LİSTELEME ALANI */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        {/* Başlıklar */}
        <div className="grid grid-cols-12 gap-4 p-5 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <div className="col-span-4">MÜŞTERİ ADI</div>
          <div className="col-span-3">İLETİŞİM</div>
          <div className="col-span-3">ADRES</div>
          <div className="col-span-2 text-right">BAKİYE</div>
        </div>

        {/* Yükleniyor veya Boş Durum */}
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
              <User size={40} />
            </div>
            <h3 className="text-xl font-bold text-[#1B2559]">Henüz Müşteri Yok</h3>
            <p className="text-gray-500 mt-2">Sağ üstteki butondan ilk müşterini ekle.</p>
          </div>
        ) : (
          /* MÜŞTERİ SATIRLARI */
          customers.map((customer) => (
            <div key={customer.id} className="grid grid-cols-12 gap-4 p-5 border-b border-gray-50 hover:bg-blue-50/30 transition-colors items-center">
              <div className="col-span-4 font-bold text-[#1B2559] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                  {customer.name.substring(0, 2).toUpperCase()}
                </div>
                {customer.name}
              </div>
              <div className="col-span-3 text-sm text-gray-500 space-y-1">
                <div className="flex items-center gap-2"><Phone size={14}/> {customer.phone || '-'}</div>
                <div className="flex items-center gap-2"><Mail size={14}/> {customer.email || '-'}</div>
              </div>
              <div className="col-span-3 text-sm text-gray-500 truncate pr-4">
                {customer.address || 'Adres Girilmemiş'}
              </div>
              <div className="col-span-2 text-right font-bold text-gray-700">
                ₺{customer.balance?.toLocaleString() || '0'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* POP-UP (MODAL) PENCERE - Müşteri Ekleme */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1B2559]">Yeni Müşteri Ekle</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-500" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Müşteri / Firma Adı</label>
                <input 
                  required
                  autoFocus
                  type="text" 
                  placeholder="Örn: Ahmet Yılmaz veya Yılmaz İnşaat"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Telefon</label>
                  <input 
                    type="text" 
                    placeholder="0555..."
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">E-Posta</label>
                  <input 
                    type="email" 
                    placeholder="mail@site.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Adres</label>
                <textarea 
                  rows={3}
                  placeholder="Fatura adresi..."
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-blue-500/20 resize-none"
                ></textarea>
              </div>

              <button 
                disabled={saving}
                className="w-full bg-[#3063E9] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#2552D0] transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
                {saving ? "Kaydediliyor..." : "Müşteriyi Kaydet"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}