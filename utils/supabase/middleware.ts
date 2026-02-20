import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Oturumu kontrol et
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // --- SİBER KORUMA VE YÖNLENDİRME MANTIĞI (MASTER) ---

  // 1. ZIRH: Kullanıcı GİRİŞ YAPMAMIŞSA
  // Müşteri Giriş (/portal) ve Müşteri Kayıt (/portal/register) sayfalarına dokunma!
  // Ancak /portal/CARI-123 gibi korumalı alt sayfalara veya dashboard'a girmeye çalışırsa /login'e at.
  const isKorumaliAltSayfa = path.startsWith('/portal/') || path.startsWith('/dashboard') || path.startsWith('/onboarding')
  const isHalkaAcikPortal = path === '/portal' || path === '/portal/register'

  if (isKorumaliAltSayfa && !isHalkaAcikPortal && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. ROTA: Kullanıcı GİRİŞ YAPMIŞSA
  // Eğer kullanıcı zaten içerideyse ve yanlışlıkla /login'e veya ana sayfaya (/) giderse, 
  // onu akıllı yönlendirme merkezine (/portal) fırlat.
  if ((path === '/login' || path === '/') && user) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  return response
}