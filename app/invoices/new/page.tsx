'use client';
import React, { useState } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form verilerini tutan yer (State)
  const [formData, setFormData] = useState({
    customer_name: 'Durmaz Toptan',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: ''
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSave = async () => {
    if (!formData.amount) return alert("Lütfen bir tutar girin!");
    setLoading(true);

    // 1. Kullanıcının hangi şirkete bağlı olduğunu bul
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single();

    // 2. Veriyi kaydet
    const { error } = await supabase.from('invoices').insert([{
      company_id: profile?.company_id,
      customer_name: formData.customer_name,
      invoice_date: formData.invoice_date,
      due_date: formData.due_date,
      amount: parseFloat(formData.amount),
      status: 'Beklemede'
    }]);

    if (error) {
      alert("Hata oluştu: " + error.message);
    } else {
      alert("Fatura başarıyla kaydedildi! 🚀");
      router.push('/invoices'); // Kayıttan sonra listeye dön
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Link href="/invoices" className="text-blue-600 flex items-center gap-2 mb-6 hover:underline font-medium">
        <ArrowLeft size={18} /> Faturalara Dön
      </Link>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Yeni Fatura Oluştur</h1>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Müşteri Seçin</label>
            <select 
              className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-gray-50"
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
            >
              <option>Durmaz Toptan</option>
              <option>Yusuf Ltd. Şti.</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fatura Tarihi</label>
              <input 
                type="date" 
                value={formData.invoice_date}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none"
                onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vade Tarihi</label>
              <input 
                type="date" 
                className="w-full p-3 border border-gray-200 rounded-xl outline-none"
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Toplam Tutar</label>
            <input 
              type="number" 
              placeholder="0.00" 
              className="w-full p-3 border border-gray-200 rounded-xl outline-none"
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Faturayı Sisteme Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}