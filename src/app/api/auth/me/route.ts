'use server'

import { NextResponse } from 'next/server'
import { getSupabaseRouteClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await getSupabaseRouteClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    // Devuelve 200 con usuario nulo cuando no hay sesión para evitar 401 en el cliente
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({ user: data.user ?? null })
}