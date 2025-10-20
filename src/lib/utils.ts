import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función helper para obtener el nombre completo a partir de first_name y last_name
export function getFullName(firstName?: string | null, lastName?: string | null): string {
  if (!firstName && !lastName) return ''
  if (!firstName) return lastName || ''
  if (!lastName) return firstName || ''
  return `${firstName} ${lastName}`
}