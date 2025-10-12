'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  getGroupAccessRequests, 
  approveAccessRequest, 
  rejectAccessRequest,
  type AccessRequestWithProfile 
} from '@/lib/group-access-requests'
import { useAuth } from '@/contexts/AuthContext'

interface AccessRequestsModalProps {
  groupId: string
  groupName: string
  isOpen: boolean
  onClose: () => void
}

export default function AccessRequestsModal({ 
  groupId, 
  groupName, 
  isOpen, 
  onClose 
}: AccessRequestsModalProps) {
  const { user } = useAuth()
  const [requests, setRequests] = useState<AccessRequestWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await getGroupAccessRequests(groupId)
      if (error) {
        console.error('Error fetching requests:', error)
      } else {
        setRequests(data || [])
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    if (isOpen && groupId) {
      fetchRequests()
    }
  }, [isOpen, groupId, fetchRequests])

  const handleApprove = async (requestId: string) => {
    if (!user) return

    setProcessingRequest(requestId)
    try {
      const { error } = await approveAccessRequest(requestId, user.id)
      if (error) {
        alert(`Error: ${error}`)
      } else {
        alert('Solicitud aprobada correctamente')
        fetchRequests() // Refrescar la lista
      }
    } catch (error) {
      console.error('Error approving request:', error)
      alert('Error al aprobar la solicitud')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!user) return

    setProcessingRequest(requestId)
    try {
      const { error } = await rejectAccessRequest(requestId, user.id)
      if (error) {
        alert(`Error: ${error}`)
      } else {
        alert('Solicitud rechazada')
        fetchRequests() // Refrescar la lista
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      alert('Error al rechazar la solicitud')
    } finally {
      setProcessingRequest(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-main rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-text-main">Solicitudes de Acceso</h2>
            <p className="text-sm text-text-secondary mt-1">{groupName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-main transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
              </svg>
              <p className="text-text-secondary">No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-text-main">
                          {request.profiles?.full_name || 'Usuario'}
                        </h3>
                        <div className="text-sm text-text-secondary space-y-1">
                          {request.profiles?.skill_level && (
                            <p>Nivel: {request.profiles.skill_level}/10</p>
                          )}
                          {(request.profiles?.city || request.profiles?.country) && (
                            <p>
                              {request.profiles.city}
                              {request.profiles.city && request.profiles.country && ', '}
                              {request.profiles.country}
                            </p>
                          )}
                          {request.requested_at && <p>Solicitado: {new Date(request.requested_at).toLocaleDateString()}</p>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingRequest === request.id}
                        className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {processingRequest === request.id ? 'Procesando...' : 'Aprobar'}
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processingRequest === request.id}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {processingRequest === request.id ? 'Procesando...' : 'Rechazar'}
                      </button>
                    </div>
                  </div>
                  
                  {request.message && (
                    <div className="mt-3 p-3 bg-bg-secondary rounded-lg">
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium">Mensaje:</span> {request.message}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bg-secondary hover:bg-border text-text-main rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}