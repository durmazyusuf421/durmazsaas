'use client';
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Users, ShieldCheck, ShieldAlert, Loader2, Save } from 'lucide-react';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Personel Listesini Çek
  const fetchStaff = async () => {
    setLoading(true);
    // Not: E-postaları görmek için profiles tablosuna email sütunu eklemiştik
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (!error) setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  // 2. Yetki Şalterini Değiştir
  const togglePermission = async (userId: string, currentPerms: any, key: string) => {
    setUpdating(userId);
    const updatedPerms = { ...currentPerms, [key]: !currentPerms[key] };

    const { error } = await supabase
      .from('profiles')
      .update({ permissions: updatedPerms })
      .eq('id', userId);

    if (!error) {
      setStaff(staff.map(user => 
        user.id === userId ? { ...user, permissions: updatedPerms } : user
      ));
    } else {
      alert("Yetki güncellenemedi!");
    }
    setUpdating(null);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="text-blue-600" /> Personel Yetki Yönetimi
        </h1>
        <p className="text-gray-500">Çalışanlarınızın hangi sayfalara erişebileceğini buradan kontrol edin.</p>
      </div>

      <div className="grid gap-6">
        {staff.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400 font-mono mb-1">ID: {user.id.slice(0,8)}...</p>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {user.email || "İsimsiz Kullanıcı"}
                {user.role === 'admin' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Admin</span>}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {['ana_sayfa', 'cari_kartlar', 'faturalar', 'urunler', 'ayarlar'].map((perm) => (
                <button
                  key={perm}
                  disabled={updating === user.id}
                  onClick={() => togglePermission(user.id, user.permissions, perm)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    user.permissions?.[perm] 
                      ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' 
                      : 'bg-gray-50 text-gray-400 border-gray-100 opacity-60'
                  }`}
                >
                  {perm.replace('_', ' ').toUpperCase()}
                  {user.permissions?.[perm] ? ' ✓' : ' ✕'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}