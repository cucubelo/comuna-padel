'use client'

import React from 'react'
import Link from 'next/link'

interface GroupCardProps {
  group: {
    id: string
    name: string
    description?: string
    current_members?: number
    city?: string
    group_type: string
    creator_name?: string
    user_role?: 'admin' | 'member'
  }
  onJoin?: (groupId: string) => void
  onLeave?: (groupId: string) => void
  showJoinButton?: boolean
}

export default function GroupCard({ 
  group, 
  onJoin, 
  onLeave,
  showJoinButton = false
}: GroupCardProps) {
  return (
    <div className="bg-bg-main rounded-lg p-6 border border-border hover:border-accent-primary/40 transition-all duration-200 shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-text-main font-montserrat">
              {group.name}
            </h3>
            {group.group_type === 'private' && (
              <div className="flex items-center">
                <svg className="h-4 w-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}
            {group.user_role === 'admin' && (
              <span className="px-2 py-1 text-xs font-medium bg-accent-primary/10 text-accent-primary rounded-full border border-accent-primary/20">
                Admin
              </span>
            )}
          </div>
          
          {group.description && (
            <p className="text-sm text-text-secondary font-open-sans mb-3 line-clamp-2">
              {group.description}
            </p>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Members */}
        <div className="flex items-center text-sm">
          <svg className="h-4 w-4 text-accent-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-text-secondary font-open-sans">
            {group.current_members || 0} miembros
          </span>
        </div>

        {/* City */}
        {group.city && (
          <div className="flex items-center text-sm">
            <svg className="h-4 w-4 text-accent-secondary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-text-secondary font-open-sans truncate">
              {group.city}
            </span>
          </div>
        )}
      </div>

      {/* Creator */}
      {group.creator_name && (
        <div className="text-xs text-text-secondary font-open-sans mb-4">
          Creado por {group.creator_name}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link 
          href={`/dashboard/groups/${group.id}`}
          className="flex-1 bg-accent-primary/10 text-accent-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-primary/20 transition-colors text-center border border-accent-primary/20"
        >
          Ver Detalles
        </Link>
        
        {showJoinButton && onJoin && (
          <button
            onClick={() => onJoin(group.id)}
            className="bg-success text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
          >
            Unirse
          </button>
        )}
        
        {group.user_role === 'member' && onLeave && (
          <button
            onClick={() => onLeave(group.id)}
            className="bg-error/10 text-error px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/20 transition-colors border border-error/20"
          >
            Salir
          </button>
        )}
      </div>
    </div>
  )
}