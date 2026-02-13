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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // --- KORUMA MANTIĞI (GÜVENLİK) ---

  // 1. Kullanıcı GİRİŞ YAPMAMIŞSA ve Dashboard'a girmeye çalışıyorsa -> Login'e at
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Kullanıcı GİRİŞ YAPMIŞSA ve Login sayfasına gitmeye çalışıyorsa -> Dashboard'a at
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}