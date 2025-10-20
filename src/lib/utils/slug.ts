/**
 * Utilidades para manejo de slugs en URLs amigables
 * Genera slugs basados en nombre + primeros 6 caracteres del UUID
 */

/**
 * Genera un slug URL-friendly desde un texto y UUID
 * @param text - Texto base (nombre del grupo)
 * @param id - UUID del grupo
 * @returns Slug en formato: "nombre-grupo-abc123"
 */
export function generateSlug(text: string, id: string): string {
  // Obtener los primeros 6 caracteres del UUID
  const shortId = id.substring(0, 6);
  
  // Generar slug base desde el texto
  let baseSlug = text.toLowerCase();
  
  // Reemplazar caracteres especiales españoles
  const charMap: { [key: string]: string } = {
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a',
    'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
    'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o',
    'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
    'ñ': 'n', 'ç': 'c'
  };
  
  // Aplicar reemplazos de caracteres especiales
  Object.entries(charMap).forEach(([char, replacement]) => {
    baseSlug = baseSlug.replace(new RegExp(char, 'g'), replacement);
  });
  
  // Reemplazar espacios y caracteres especiales con guiones
  baseSlug = baseSlug.replace(/[^a-z0-9]/g, '-');
  
  // Eliminar guiones múltiples
  baseSlug = baseSlug.replace(/-+/g, '-');
  
  // Eliminar guiones al inicio y final
  baseSlug = baseSlug.replace(/^-+|-+$/g, '');
  
  // Limitar longitud del slug base a 50 caracteres
  if (baseSlug.length > 50) {
    baseSlug = baseSlug.substring(0, 50);
    baseSlug = baseSlug.replace(/-+$/, ''); // Eliminar guiones finales
  }
  
  // Crear slug final con ID corto
  return `${baseSlug}-${shortId}`;
}

/**
 * Extrae el UUID original desde un slug
 * @param slug - Slug en formato "nombre-grupo-abc123"
 * @returns Los primeros 6 caracteres del UUID original
 */
export function extractIdFromSlug(slug: string): string {
  // El ID corto está al final después del último guión
  const parts = slug.split('-');
  return parts[parts.length - 1];
}

/**
 * Valida si un slug tiene el formato correcto
 * @param slug - Slug a validar
 * @returns true si el formato es válido
 */
export function isValidSlug(slug: string): boolean {
  // Debe tener al menos un guión y terminar con 6 caracteres alfanuméricos
  const slugPattern = /^[a-z0-9-]+-[a-z0-9]{6}$/;
  return slugPattern.test(slug);
}

/**
 * Genera un slug para partidos basado en ubicación y fecha
 * @param locationName - Nombre de la ubicación
 * @param scheduledAt - Fecha del partido
 * @param id - UUID del partido
 * @returns Slug en formato: "ubicacion-2024-01-15-abc123"
 */
export function generateMatchSlug(locationName: string, scheduledAt: string, id: string): string {
  // Obtener los primeros 6 caracteres del UUID
  const shortId = id.substring(0, 6);
  
  // Procesar nombre de ubicación
  let locationSlug = locationName.toLowerCase();
  
  // Reemplazar caracteres especiales españoles
  const charMap: { [key: string]: string } = {
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a',
    'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
    'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o',
    'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
    'ñ': 'n', 'ç': 'c'
  };
  
  // Aplicar reemplazos de caracteres especiales
  Object.entries(charMap).forEach(([char, replacement]) => {
    locationSlug = locationSlug.replace(new RegExp(char, 'g'), replacement);
  });
  
  // Reemplazar espacios y caracteres especiales con guiones
  locationSlug = locationSlug.replace(/[^a-z0-9]/g, '-');
  
  // Eliminar guiones múltiples
  locationSlug = locationSlug.replace(/-+/g, '-');
  
  // Eliminar guiones al inicio y final
  locationSlug = locationSlug.replace(/^-+|-+$/g, '');
  
  // Limitar longitud
  if (locationSlug.length > 30) {
    locationSlug = locationSlug.substring(0, 30);
    locationSlug = locationSlug.replace(/-+$/, '');
  }
  
  // Extraer fecha en formato YYYY-MM-DD
  const date = new Date(scheduledAt);
  const dateStr = date.toISOString().split('T')[0];
  
  // Crear slug final
  return `${locationSlug}-${dateStr}-${shortId}`;
}

/**
 * Tipos TypeScript para los slugs
 */
export type GroupSlug = string;
export type MatchSlug = string;

/**
 * Interfaz para datos de slug de grupo
 */
export interface GroupSlugData {
  slug: GroupSlug;
  shortId: string;
  originalId: string;
}

/**
 * Interfaz para datos de slug de partido
 */
export interface MatchSlugData {
  slug: MatchSlug;
  shortId: string;
  originalId: string;
  locationName: string;
  date: string;
}