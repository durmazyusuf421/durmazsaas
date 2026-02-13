import { redirect } from 'next/navigation';

export default function Home() {
  // Burası sitenin ana kapısıdır.
  // Gelen herkesi bekletmeden direkt Yönetim Paneline (Dashboard) gönderiyoruz.
  redirect('/dashboard');
}