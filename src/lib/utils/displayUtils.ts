/**
 * Utilidades para mostrar información de usuario con fallbacks apropiados
 */

export interface UserDisplayInfo {
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  email?: string | null
}

/**
 * Obtiene el nombre completo de un usuario con fallbacks apropiados
 * @param user - Información del usuario
 * @returns Nombre para mostrar o fallback apropiado
 */
export function getDisplayName(user: UserDisplayInfo): string {
  // Intentar construir nombre completo
  const firstName = user.first_name?.trim()
  const lastName = user.last_name?.trim()
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }
  
  if (firstName) {
    return firstName
  }
  
  if (lastName) {
    return lastName
  }
  
  // Fallback a username
  if (user.username?.trim()) {
    return `@${user.username}`
  }
  
  // Fallback a email (solo la parte antes del @)
  if (user.email?.trim()) {
    const emailPrefix = user.email.split('@')[0]
    return emailPrefix
  }
  
  // Último fallback
  return 'Usuario'
}

/**
 * Obtiene el username principal para mostrar
 * @param user - Información del usuario
 * @returns Username o fallback apropiado
 */
export function getPrimaryDisplayName(user: UserDisplayInfo): string {
  // Priorizar username
  if (user.username?.trim()) {
    return `@${user.username}`
  }
  
  // Fallback a email (solo la parte antes del @)
  if (user.email?.trim()) {
    const emailPrefix = user.email.split('@')[0]
    return emailPrefix
  }
  
  // Fallback a nombre completo
  const firstName = user.first_name?.trim()
  const lastName = user.last_name?.trim()
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }
  
  if (firstName) {
    return firstName
  }
  
  if (lastName) {
    return lastName
  }
  
  // Último fallback
  return 'Usuario'
}

/**
 * Obtiene el nombre secundario (nombre real) para mostrar debajo del username
 * @param user - Información del usuario
 * @returns Nombre real o null si no está disponible
 */
export function getSecondaryDisplayName(user: UserDisplayInfo): string | null {
  const firstName = user.first_name?.trim()
  const lastName = user.last_name?.trim()
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }
  
  if (firstName) {
    return firstName
  }
  
  if (lastName) {
    return lastName
  }
  
  return null
}

/**
 * Obtiene las iniciales de un usuario para avatares
 * @param user - Información del usuario
 * @returns Iniciales o fallback
 */
export function getUserInitials(user: UserDisplayInfo): string {
  const firstName = user.first_name?.trim()
  const lastName = user.last_name?.trim()
  
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }
  
  if (firstName) {
    return firstName.charAt(0).toUpperCase()
  }
  
  if (lastName) {
    return lastName.charAt(0).toUpperCase()
  }
  
  if (user.username?.trim()) {
    return user.username.charAt(0).toUpperCase()
  }
  
  if (user.email?.trim()) {
    return user.email.charAt(0).toUpperCase()
  }
  
  return 'U'
}