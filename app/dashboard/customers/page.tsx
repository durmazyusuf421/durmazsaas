'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Plus, Search, Mail, Phone, MapPin, Trash2, Edit, Save, X, Loader2, User 
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', authData.user.id)
        .single();

      if (profileData?.company_id) {
        const { data: customerList, error: fetchError } = await supabase
          .from('customers')
          .select('*')
          .eq('company_id', profileData.company_id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setCustomers(customerList || []);
      }
    } catch (err) {
      console.error("Veri çekme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return alert("Müşteri adı boş bırakılamaz!");
    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', authData.user?.id)
        .single();

      if (!profileData) throw new Error("Profil bulunamadı.");

      if (currentCustomer) {
        const { error: updateError } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', currentCustomer.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('customers')
          .insert([{ ...formData, company_id: profileData.company_id }]);
        if (insertError) throw insertError;
      }
      
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
      fetchData();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2559]">Müşteriler</h1>
          <p className="text-gray-500 text-sm">Müşteri listesi ve yönetimi.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Ara..." 
              className="pl-10 pr-4 py-3 bg-white rounded-xl border-none focus:ring-2 ring-blue-500/20 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setCurrentCustomer(null); setFormData({name:'', email:'', phone:'', address:''}); setIsModalOpen(true); }}
            className="bg-[#3063E9] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2552D0] flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus size={20} /> Yeni Müşteri
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-12 gap-4 p-5 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <div className="col-span-4">MÜŞTERİ</div>
              <div className="col-span-3">İLETİŞİM</div>
              <div className="col-span-3">ADRES</div>
              <div className="col-span-2 text-right">İŞLEM</div>
            </div>

            {loading ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                <User size={40} className="mb-2 opacity-20" />
                <p>Kayıt bulunamadı.</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="grid grid-cols-12 gap-4 p-5 border-b border-gray-50 hover:bg-blue-50/30 transition-colors items-center">
                  <div className="col-span-4 font-bold text-[#1B2559] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold uppercase shrink-0">
                      {customer.name.substring(0, 2)}
                    </div>
                    <span className="truncate">{customer.name}</span>
                  </div>
                  <div className="col-span-3 text-sm text-gray-500 space-y-1">
                    <div className="flex items-center gap-2"><Phone size={14}/> {customer.phone || '-'}</div>
                    <div className="flex items-center gap-2"><Mail size={14}/> {customer.email || '-'}</div>
                  </div>
                  <div className="col-span-3 text-sm text-gray-500 truncate pr-4 text-left">
                    <MapPin size={14} className="inline mr-1" />
                    {customer.address || 'Adres Girilmemiş'}
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => { 
                      setCurrentCustomer(customer); 
                      setFormData({name:customer.name, email:customer.email || '', phone:customer.phone || '', address:customer.address || ''}); 
                      setIsModalOpen(true); 
                    }} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"><Edit size={18}/></button>
                    <button onClick={async () => { 
                      if(confirm("Silmek istediğinize emin misiniz?")) { 
                        await supabase.from('customers').delete().eq('id', customer.id); 
                        fetchData(); 
                      } 
                    }} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-[#1B2559]">{currentCustomer ? 'Düzenle' : 'Yeni Müşteri'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-500"/></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Müşteri Adı" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="Telefon" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input placeholder="E-posta" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <textarea placeholder="Adres" className="w-full p-3 bg-gray-50 rounded-xl outline-none h-24 resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              <button onClick={handleSave} disabled={saving} className="w-full bg-[#3063E9] text-white py-4 rounded-xl font-bold shadow-lg">
                {saving ? <Loader2 className="animate-spin mx-auto" /> : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}