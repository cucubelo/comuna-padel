'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Configuración del QueryClient con opciones optimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo de cache por defecto: 5 minutos
      staleTime: 5 * 60 * 1000,
      // Tiempo antes de que los datos se consideren obsoletos: 10 minutos
      gcTime: 10 * 60 * 1000,
      // Reintentar automáticamente en caso de error
      retry: (failureCount, error: any) => {
        // No reintentar para errores de autenticación
        if (error?.status === 401 || error?.status === 403) {
          return false
        }
        // Reintentar hasta 3 veces para otros errores
        return failureCount < 3
      },
      // Refetch automático cuando la ventana vuelve a tener foco
      refetchOnWindowFocus: false,
      // Refetch automático cuando se reconecta la red
      refetchOnReconnect: true,
    },
    mutations: {
      // Reintentar mutaciones fallidas una vez
      retry: 1,
    },
  },
})

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Solo mostrar devtools en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

export { queryClient }