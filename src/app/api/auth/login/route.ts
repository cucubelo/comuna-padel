'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/lib/types/supabase'

export async function POST(req: NextRequest) {
  const { email, password, remember30Days } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  // Acumular cookies que el cliente de Supabase intente set/remove para aplicarlas al NextResponse final
  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = []

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          pendingCookies.push({ name, value, options })
        },
        remove(name: string, options: CookieOptions) {
          pendingCookies.push({ name, value: '', options })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  const response = NextResponse.json({ user: data.user })

  // Aplicar las cookies de sesión que haya gestionado Supabase
  for (const c of pendingCookies) {
    response.cookies.set({ ...c.options, name: c.name, value: c.value })
  }

  // Establecer cookies no HttpOnly para preferencias de "Recordarme"
  try {
    const nowIso = new Date().toISOString()
    const maxAgeSeconds = remember30Days ? (30 * 24 * 60 * 60) : (7 * 24 * 60 * 60)

    response.cookies.set('cp_login_at', nowIso, {
      path: '/',
      sameSite: 'lax',
      maxAge: maxAgeSeconds
    })

    response.cookies.set('cp_remember_30', remember30Days ? '1' : '0', {
      path: '/',
      sameSite: 'lax',
      maxAge: maxAgeSeconds
    })
  } catch (cookieErr) {
    console.warn('Error estableciendo cookies de preferencia:', cookieErr)
  }

  return response
}