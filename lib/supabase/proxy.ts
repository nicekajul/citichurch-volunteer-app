import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard']
const AUTH_PAGES = ['/login', '/signup']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            )
          },
        },
      },
    )

    // getUser() re-validates the token against Supabase Auth rather than trusting
    // the (spoofable) session cookie — this is the check that's safe to gate on.
    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
    const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p))

    if (isProtected && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (isAuthPage && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie)
      })
      return redirectResponse
    }
  } catch (error) {
    console.error('Supabase proxy initialization error:', error)
    // Still return response even if Supabase fails
  }

  return supabaseResponse
}
