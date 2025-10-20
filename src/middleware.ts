import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas que requieren autenticación
const protectedRoutes = ['/dashboard', '/profile']

// Rutas que solo pueden acceder usuarios no autenticados
const publicOnlyRoutes = ['/auth']

export async function middleware(request: NextRequest) {
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
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ ...options, name, value })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ ...options, name, value })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ ...options, name, value: '' })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ ...options, name, value: '' })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicOnlyRoute = publicOnlyRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (isPublicOnlyRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Excluir todas las rutas internas de Next.js bajo /_next/* para evitar que la middleware
     * intercepte peticiones internas del dev server (como /_next/src/*) que terminan en 404.
     * También excluimos favicon.ico.
     */
    '/((?!_next/|_next/static|_next/image|favicon.ico).*)',
  ],
}