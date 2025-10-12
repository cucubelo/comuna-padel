"use client";

import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Con el middleware del servidor, ya no necesitamos verificación del lado del cliente
  // El middleware se encarga de redirigir antes de que llegue aquí
  return <>{children}</>;
}

// Componente para rutas que requieren que el usuario NO esté autenticado (como login/register)
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  // Con el middleware del servidor, ya no necesitamos verificación del lado del cliente
  // El middleware se encarga de redirigir antes de que llegue aquí
  return <>{children}</>;
}

// Hook personalizado para verificar autenticación en componentes (mantener compatibilidad)
export function useProtectedRoute() {
  // Este hook ya no es necesario con middleware, pero lo mantenemos para compatibilidad
  return {
    user: null,
    loading: false,
    isAuthenticated: true, // Asumimos que si llegamos aquí, el middleware ya verificó
  };
}
