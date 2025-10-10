'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface GroupCardProps {
  group: {
    id: string
    name: string
    description?: string
    current_members?: number
    city?: string
    country?: string
    country_code?: string
    postal_code?: string
    place_name?: string
    group_type: string
    creator_name?: string
    user_role?: 'admin' | 'member'
  }
  onJoin?: (groupId: string) => void
  onLeave?: (groupId: string) => void
  onEdit?: (group: GroupCardProps['group']) => void
  showJoinButton?: boolean
}

export default function GroupCard({ 
  group, 
  onJoin, 
  onLeave,
  onEdit: _onEdit, // Renombrado para indicar que no se usa actualmente
  showJoinButton = false
}: GroupCardProps) {
  const router = useRouter()
  return (
    <div className="bg-bg-main border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Header Section */}
      <div className="p-4 sm:p-6">
        {/* Title with bottom border */}
        <div className="border-b border-border pb-3 sm:pb-4 mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-text-main font-open-sans line-clamp-2">
            {group.name}
          </h3>
        </div>

        {/* Description Section */}
        <div className="mb-4 sm:mb-6">
          <p className="text-text-secondary text-sm sm:text-base font-open-sans line-clamp-3 leading-relaxed">
            {group.description}
          </p>
        </div>

        {/* Information Grid */}
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {/* Members Info */}
          <div className="flex items-center gap-3 p-2 sm:p-3 bg-bg-secondary/50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.916-.75M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.916-.75M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-text-secondary font-open-sans">Miembros</p>
              <p className="text-sm sm:text-base font-medium text-text-main font-open-sans">
                {group.current_members || 0} miembros
              </p>
            </div>
          </div>

          {/* Location Info */}
          {(group.city || group.place_name) && (
            <div className="flex items-start gap-3 p-2 sm:p-3 bg-bg-secondary/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-accent-secondary/10 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-accent-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-text-secondary font-open-sans mb-1">Ubicación</p>
                <div className="space-y-0.5">
                  {group.place_name && (
                    <p className="text-sm sm:text-base font-medium text-text-main font-open-sans line-clamp-1">
                      {group.place_name}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-text-secondary font-open-sans line-clamp-1">
                    {group.city}, {group.country}
                  </p>
                  {group.postal_code && (
                    <span className="inline-block bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded text-xs font-medium">
                      {group.postal_code}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Creator Info */}
          {group.creator_name && (
            <div className="flex items-center gap-3 p-2 sm:p-3 bg-bg-secondary/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-text-secondary font-open-sans">Creador</p>
                <p className="text-sm sm:text-base font-medium text-text-main font-open-sans line-clamp-1">
                  {group.creator_name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
            {group.group_type === 'public' ? 'Público' : 'Privado'}
          </span>
          {group.user_role === 'admin' && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
              Admin
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link 
            href={`/dashboard/groups/${group.id}`}
            className="flex-1 bg-accent-primary/10 text-accent-primary px-4 py-2.5 sm:py-3 rounded-lg font-medium font-open-sans transition-colors text-center border border-accent-primary/20 hover:border-accent-primary/40 text-sm sm:text-base cursor-pointer"
          >
            Ver detalles
          </Link>
          
          {showJoinButton && onJoin && (
            <button
              onClick={() => onJoin(group.id)}
              className="flex-1 bg-accent-primary hover:bg-accent-primary/90 text-bg-main px-4 py-2.5 sm:py-3 rounded-lg font-medium font-open-sans transition-colors text-sm sm:text-base cursor-pointer"
            >
              Unirse
            </button>
          )}
          
          {group.user_role === 'member' && onLeave && (
            <button
              onClick={() => onLeave(group.id)}
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 sm:py-3 rounded-lg font-medium font-open-sans transition-colors text-sm sm:text-base cursor-pointer"
            >
              Abandonar
            </button>
          )}
          
          {group.user_role === 'admin' && (
            <button
              onClick={() => router.push(`/dashboard/groups/edit/${group.id}`)}
              className="bg-bg-secondary hover:bg-border text-text-main border border-border px-4 py-2.5 sm:py-3 rounded-lg font-medium font-open-sans transition-colors text-sm sm:text-base cursor-pointer"
            >
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}