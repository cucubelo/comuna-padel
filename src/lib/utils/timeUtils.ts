/**
 * Utilidades para manejar tiempo y expiración de invitaciones
 */

export interface TimeRemaining {
  hours: number
  minutes: number
  isExpired: boolean
  displayText: string
}

/**
 * Calcula el tiempo restante hasta la expiración de una invitación
 */
export function getTimeUntilExpiration(expiresAt: string): TimeRemaining {
  const now = new Date()
  const expiration = new Date(expiresAt)
  const diffMs = expiration.getTime() - now.getTime()

  if (diffMs <= 0) {
    return {
      hours: 0,
      minutes: 0,
      isExpired: true,
      displayText: 'Expirada'
    }
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  let displayText = ''
  if (hours > 0) {
    displayText = `${hours}h ${minutes}m restantes`
  } else if (minutes > 0) {
    displayText = `${minutes}m restantes`
  } else {
    displayText = 'Menos de 1m restante'
  }

  return {
    hours,
    minutes,
    isExpired: false,
    displayText
  }
}

/**
 * Verifica si una invitación ha expirado
 */
export function isInvitationExpired(expiresAt: string): boolean {
  const now = new Date()
  const expiration = new Date(expiresAt)
  return expiration.getTime() <= now.getTime()
}

/**
 * Formatea la fecha de expiración para mostrar al usuario
 */
export function formatExpirationDate(expiresAt: string): string {
  const expiration = new Date(expiresAt)
  return expiration.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}