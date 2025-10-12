'use server'

import { NextResponse } from 'next/server'
import { getSupabaseRouteClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = await getSupabaseRouteClient()
  await supabase.auth.signOut()

  const response = NextResponse.json({ message: 'Logged out' })
  
  // Limpiar cookies de preferencia de "Recordarme"
  response.cookies.set('cp_login_at', '', {
    path: '/',
    expires: new Date(0)
  })
  
  response.cookies.set('cp_remember_30', '', {
    path: '/',
    expires: new Date(0)
  })

  return response
}