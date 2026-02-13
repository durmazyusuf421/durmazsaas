export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1B2559]">Personel Yönetimi</h1>
        <button className="bg-[#3063E9] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#234bca] transition-colors">
          + Yeni Personel Ekle
        </button>
      </div>

      <div className="bg-white p-8 rounded-[20px] shadow-sm border border-gray-100 text-center py-20">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-xl font-bold text-gray-800">Henüz Personel Yok</h3>
        <p className="text-gray-500 mt-2">Rabia'yı veya diğer çalışma arkadaşlarını buradan ekleyeceksin.</p>
      </div>
    </div>
  );
}