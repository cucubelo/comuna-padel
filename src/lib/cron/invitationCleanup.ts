import { cleanupExpiredInvitations } from '@/lib/matchInvitations'

/**
 * Función para ejecutar la limpieza de invitaciones expiradas
 * Esta función puede ser llamada por un cron job o ejecutada periódicamente
 */
export async function runInvitationCleanup(): Promise<void> {
  console.log('Iniciando limpieza de invitaciones expiradas...')
  
  try {
    const result = await cleanupExpiredInvitations()
    
    if (result.success) {
      console.log(`✅ Limpieza completada. ${result.cleanedCount} invitaciones marcadas como expiradas.`)
    } else {
      console.error('❌ Error durante la limpieza:', result.error)
    }
  } catch (error) {
    console.error('❌ Error inesperado durante la limpieza:', error)
  }
}

/**
 * Función para ejecutar la limpieza de forma programática
 * Útil para testing o ejecución manual
 */
export async function scheduleInvitationCleanup(): Promise<void> {
  // Ejecutar inmediatamente
  await runInvitationCleanup()
  
  // Programar ejecución cada hora (3600000 ms)
  setInterval(async () => {
    await runInvitationCleanup()
  }, 3600000) // 1 hora
}

// Si este archivo se ejecuta directamente, ejecutar la limpieza
if (require.main === module) {
  runInvitationCleanup()
}