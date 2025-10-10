'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Session, AuthError } from '@supabase/supabase-js'

interface SessionInfo {
  session: Session | null
  error: AuthError | null
}

export default function SessionDebugger() {
  const { user, session, profile, loading } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)

  useEffect(() => {
    const getSessionInfo = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      setSessionInfo({ session, error })
    }
    
    if (isVisible) {
      getSessionInfo()
    }
  }, [isVisible])

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-red-500 text-white px-3 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-red-600 transition-colors"
      >
        DEBUG
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-black text-white p-4 rounded-lg shadow-xl max-w-md w-80 text-xs font-mono">
          <div className="mb-2">
            <strong>Auth Context:</strong>
          </div>
          <div className="space-y-1 mb-4">
            <div>Loading: {loading ? 'true' : 'false'}</div>
            <div>User: {user ? `${user.id.slice(0, 8)}...` : 'null'}</div>
            <div>Session: {session ? 'active' : 'null'}</div>
            <div>Profile: {profile ? 'loaded' : 'null'}</div>
          </div>
          
          <div className="mb-2">
            <strong>Session Details:</strong>
          </div>
          <div className="space-y-1 mb-4">
            {session && (
              <>
                <div>Expires: {new Date(session.expires_at! * 1000).toLocaleString()}</div>
                <div>Token Type: {session.token_type}</div>
                <div>Access Token: {session.access_token.slice(0, 20)}...</div>
              </>
            )}
          </div>
          
          <div className="mb-2">
            <strong>Direct Supabase:</strong>
          </div>
          <div className="space-y-1">
            <div>Session: {sessionInfo?.session ? 'active' : 'null'}</div>
            <div>Error: {sessionInfo?.error ? sessionInfo.error.message : 'none'}</div>
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="mt-4 bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}