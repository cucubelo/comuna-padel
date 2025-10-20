/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuthQuery } from '@/hooks/useAuth'
import { UserProfileSkeleton } from '@/components/ui/Suspense'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/dashboard/LogoutButton'
import SessionDebugger from '@/components/dashboard/SessionDebugger'
import { getFullName } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuthQuery()
  const avatarUrl = profile?.avatar_url || null
  
  // Mejorar el manejo del nombre de usuario con loading state
  const getDisplayName = () => {
    // Si estamos cargando y no tenemos perfil aún, mostrar skeleton
    if (isLoading || (user && !profile)) {
      return null // Retornamos null para mostrar skeleton
    }
    
    // Si tenemos perfil, usar first_name y last_name, sino usar email como fallback
    return getFullName(profile?.first_name, profile?.last_name) || user?.email || 'Usuario'
  }
  
  const displayName = getDisplayName()
  
  const pathname = usePathname()
  const isActive = (route: string) => (route === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(route))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [groupsOpen, setGroupsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="bg-bg-main shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center min-w-0">
              <img src="/logo.png" alt="Comuna Padel" className="h-8 w-auto mr-3 flex-shrink-0" />
              <h1 className="text-2xl font-bold text-text-main font-montserrat truncate">Comuna Padel</h1>
            </div>

            {/* Navigation (desktop) */}
            <nav className="hidden xl:flex items-center space-x-6">
              <Link href="/dashboard" className={`${isActive('/dashboard') ? 'text-text-main font-semibold' : 'text-text-secondary hover:text-text-main'} font-open-sans`}>Inicio</Link>
              
              {/* Groups dropdown */}
              <div className="relative group">
                <button className={`${isActive('/dashboard/groups') ? 'text-text-main font-semibold' : 'text-text-secondary hover:text-text-main'} font-open-sans flex items-center gap-1`}>
                  Grupos
                  <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute top-full left-0 mt-1 w-48 bg-bg-main border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link href="/dashboard/groups?tab=my-groups" className={`block px-4 py-2 text-sm ${isActive('/dashboard/groups') && pathname.includes('my-groups') ? 'text-text-main bg-bg-secondary' : 'text-text-secondary hover:text-text-main hover:bg-bg-secondary/50'} font-open-sans`}>
                      Mis Grupos
                    </Link>
                    <Link href="/dashboard/groups?tab=recommended" className={`block px-4 py-2 text-sm ${isActive('/dashboard/groups') && pathname.includes('recommended') ? 'text-text-main bg-bg-secondary' : 'text-text-secondary hover:text-text-main hover:bg-bg-secondary/50'} font-open-sans`}>
                      Descubrir Grupos
                    </Link>
                  </div>
                </div>
              </div>
              
              <Link href="/dashboard/matches" className={`${isActive('/dashboard/matches') ? 'text-text-main font-semibold' : 'text-text-secondary hover:text-text-main'} font-open-sans`}>Partidos</Link>
              <Link href="/dashboard/stats" className={`${isActive('/dashboard/stats') ? 'text-text-main font-semibold' : 'text-text-secondary hover:text-text-main'} font-open-sans`}>Estadísticas</Link>
            </nav>

            {/* Actions: Create group + Avatar + Logout + Mobile menu toggle */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard/groups/create" className="bg-accent-primary text-bg-main px-4 py-2 rounded-md hover:bg-accent-primary/90 transition-colors font-semibold font-open-sans hidden sm:inline-block">
                Crear Grupo
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full overflow-hidden border border-border bg-bg-secondary">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-text-secondary">
                      {displayName?.charAt(0)?.toUpperCase() || '👤'}
                    </div>
                  )}
                </div>
                {/* Mostrar skeleton o nombre */}
                {displayName === null ? (
                  <UserProfileSkeleton />
                ) : (
                  <span className="hidden md:inline text-text-secondary font-open-sans truncate max-w-[160px]">{displayName}</span>
                )}
              </Link>
              <LogoutButton />
              <button
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-accordion"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="hidden sm:inline-flex xl:hidden bg-bg-secondary text-text-main px-3 py-2 rounded-md border border-border hover:bg-bg-secondary/80 transition-colors font-open-sans"
              >
                Menú
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Accordion Menu (below md) */}
      <div
        id="mobile-accordion"
        className={`hidden sm:block xl:hidden bg-bg-main border-b border-border transition-all duration-300 ${mobileMenuOpen ? 'max-h-96' : 'max-h-0 overflow-hidden'}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className={`block px-2 py-2 rounded-md ${isActive('/dashboard') ? 'bg-bg-secondary text-text-main' : 'text-text-secondary hover:text-text-main hover:bg-bg-secondary/50'}`}>
                Inicio
              </Link>
            </li>
            <li>
              <button
                type="button"
                className={`w-full text-left px-2 py-2 rounded-md flex items-center justify-between ${isActive('/dashboard/groups') ? 'bg-bg-secondary text-text-main' : 'text-text-secondary hover:text-text-main hover:bg-bg-secondary/50'}`}
                onClick={() => setGroupsOpen((v) => !v)}
                aria-expanded={groupsOpen}
              >
                <span>Grupos</span>
                <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${groupsOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <div className={`pl-4 transition-all duration-300 ${groupsOpen ? 'max-h-40' : 'max-h-0 overflow-hidden'}`}>
                <ul className="space-y-1 py-1">
                  <li>
                    <Link href="/dashboard/groups?tab=my-groups" className={`block px-2 py-2 rounded-md ${isActive('/dashboard/groups') ? 'text-text-main' : 'text-text-secondary hover:text-text-main hover:bg-bg-secondary/50'}`}>
                      Mis Grupos
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/groups?tab=recommended" className={`block px-2 py-2 rounded-md ${isActive('/dashboard/groups') ? 'text-text-main' : 'text-text-secondary hover:text-text-main hover:bg-bg-secondary/50'}`}>
                      Descubrir Grupos
                    </Link>
                  </li>
                </ul>
              </div>
            </li>
            <li>
              <Link href="/dashboard/matches" className={`block px-2 py-2 rounded-md ${isActive('/dashboard/matches') ? 'bg-bg-secondary text-text-main' : 'text-text-secondary hover:text-text-main hover:bg-bg-secondary/50'}`}>
                Partidos
              </Link>
            </li>
            <li>
              <Link href="/dashboard/stats" className={`block px-2 py-2 rounded-md ${isActive('/dashboard/stats') ? 'bg-bg-secondary text-text-main' : 'text-text-secondary hover:text-text-main hover:bg-bg-secondary/50'}`}>
                Estadísticas
              </Link>
            </li>
            <li>
              <Link href="/dashboard/profile" className={`block px-2 py-2 rounded-md ${isActive('/dashboard/profile') ? 'bg-bg-secondary text-text-main' : 'text-text-secondary hover:text-text-main hover:bg-bg-secondary/50'}`}>
                Perfil
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Page content with padding to avoid bottom nav overlap on mobile */}
      <div className="pb-24 md:pb-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}>
        {children}
      </div>

      {/* Bottom Navigation (mobile) */}
      <nav className="fixed bottom-0 inset-x-0 sm:hidden bg-bg-main border-t border-border shadow-lg z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-7xl mx-auto">
          <ul className="grid grid-cols-5">
            <li>
              <Link href="/dashboard" className={`flex flex-col items-center justify-center h-16 gap-1 ${isActive('/dashboard') ? 'text-text-main' : 'text-text-secondary'}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 10.5l9-7 9 7v9a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 19.5v-9z"/><path d="M9 21V12h6v9"/></svg>
                <span className="text-[11px] font-open-sans">Inicio</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/groups?tab=my-groups" className={`flex flex-col items-center justify-center h-16 gap-1 ${isActive('/dashboard/groups') ? 'text-text-main' : 'text-text-secondary'}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 11a4 4 0 10-8 0 4 4 0 008 0z"/><path d="M3 20a7 7 0 0118 0"/></svg>
                <span className="text-[11px] font-open-sans">Grupos</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/matches" className={`flex flex-col items-center justify-center h-16 gap-1 ${isActive('/dashboard/matches') ? 'text-text-main' : 'text-text-secondary'}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                <span className="text-[11px] font-open-sans">Partidos</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/stats" className={`flex flex-col items-center justify-center h-16 gap-1 ${isActive('/dashboard/stats') ? 'text-text-main' : 'text-text-secondary'}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 20h16"/><rect x="5" y="11" width="3" height="6"/><rect x="10.5" y="8" width="3" height="9"/><rect x="16" y="5" width="3" height="12"/></svg>
                <span className="text-[11px] font-open-sans">Estadísticas</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/profile" className={`flex flex-col items-center justify-center h-16 gap-1 ${isActive('/dashboard/profile') ? 'text-text-main' : 'text-text-secondary'}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M3 20a9 9 0 0118 0"/></svg>
                <span className="text-[11px] font-open-sans">Perfil</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Session Debugger - solo en desarrollo */}
      <SessionDebugger />
    </div>
  )
}