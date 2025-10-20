'use client'

import React, { useState } from 'react'
import { MapPin, ExternalLink, Map, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SportsLocationResult } from '@/lib/sportsLocationService'

interface LocationInfoCardProps {
  location: SportsLocationResult
  onClose?: () => void
  className?: string
  showMap?: boolean
}

export default function LocationInfoCard({ 
  location, 
  onClose, 
  className = '',
  showMap = true 
}: LocationInfoCardProps) {
  const [showMapView, setShowMapView] = useState(false)

  // Función para abrir Google Maps
  const openInGoogleMaps = () => {
    // Siempre usar la dirección completa para mejor experiencia del usuario
    const query = encodeURIComponent(`${location.name}, ${location.address}`)
    const url = `https://www.google.com/maps/search/${query}`
    window.open(url, '_blank')
  }

  // Función para generar URL del mapa embebido de OpenStreetMap con información del lugar
  const getOpenStreetMapUrl = () => {
    if (location.latitude && location.longitude) {
      // Crear un bbox más amplio para mejor contexto
      const bbox = `${location.longitude - 0.005},${location.latitude - 0.005},${location.longitude + 0.005},${location.latitude + 0.005}`
      // Incluir el marcador con el nombre del lugar
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.latitude},${location.longitude}`
    }
    return null
  }

  return (
    <div className={cn(
      "bg-bg-secondary border border-accent-primary/20 rounded-lg p-4 shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center mr-3">
            <MapPin className="h-4 w-4 text-accent-primary" />
          </div>
          <h4 className="text-accent-primary font-semibold text-sm">
            Ubicación Seleccionada
          </h4>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-main transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Location Details */}
      <div className="space-y-2 ml-11">
        {/* Nombre del lugar */}
        <div className="flex items-center text-sm">
          <span className="text-accent-primary mr-2">🏢</span>
          <span className="text-text-secondary">Lugar:</span>
          <span className="text-text-main font-medium ml-2">{location.name}</span>
        </div>

        {/* Categoría si está disponible */}
        {location.category && (
          <div className="flex items-center text-sm">
            <span className="text-accent-primary mr-2">🏷️</span>
            <span className="text-text-secondary">Tipo:</span>
            <span className="text-text-main font-medium ml-2 capitalize">{location.category}</span>
          </div>
        )}

        {/* Rating si está disponible */}
        {location.rating && (
          <div className="flex items-center text-sm">
            <span className="text-accent-primary mr-2">⭐</span>
            <span className="text-text-secondary">Valoración:</span>
            <span className="text-text-main font-medium ml-2">{location.rating}/5</span>
          </div>
        )}

        {/* Teléfono si está disponible */}
        {location.phone && (
          <div className="flex items-center text-sm">
            <span className="text-accent-primary mr-2">📞</span>
            <span className="text-text-secondary">Teléfono:</span>
            <a 
              href={`tel:${location.phone}`}
              className="text-text-main font-medium ml-2 hover:text-accent-primary transition-colors"
            >
              {location.phone}
            </a>
          </div>
        )}

        {/* Website si está disponible */}
        {location.website && (
          <div className="flex items-center text-sm">
            <span className="text-accent-primary mr-2">🌐</span>
            <span className="text-text-secondary">Web:</span>
            <a 
              href={location.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-main font-medium ml-2 hover:text-accent-primary transition-colors underline decoration-dotted flex items-center"
            >
              Visitar sitio web
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        )}

        {/* Dirección completa - solo texto */}
        <div className="flex items-start text-sm">
          <span className="text-accent-primary mr-2 mt-0.5">📍</span>
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className="text-text-secondary">Dirección:</span>
            </div>
            <div className="text-text-main font-medium break-words">
              {location.address}
            </div>
          </div>
        </div>

        {/* Ciudad y país */}
        <div className="flex items-center text-sm">
          <span className="text-accent-primary mr-2">🌍</span>
          <span className="text-text-secondary">Ubicación:</span>
          <span className="text-text-main font-medium ml-2">
            {location.city}, {location.country}
          </span>
        </div>

      </div>
  
      {/* Map Actions */}
      {showMap && location.latitude && location.longitude && (
        <div className="mt-4 ml-11 flex gap-2">
          <button
            onClick={openInGoogleMaps}
            className="flex items-center gap-2 px-3 py-2 bg-accent-primary text-bg-main rounded-md hover:bg-accent-primary/90 transition-colors text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir en Google Maps
          </button>
          
          <button
            onClick={() => setShowMapView(!showMapView)}
            className="flex items-center gap-2 px-3 py-2 bg-bg-main border border-border text-text-main rounded-md hover:bg-bg-secondary transition-colors text-sm font-medium"
          >
            <Map className="h-4 w-4" />
            {showMapView ? 'Ocultar Mapa' : 'Ver Mapa'}
          </button>
        </div>
      )}

      {/* Embedded Map */}
      {showMapView && showMap && getOpenStreetMapUrl() && (
        <div className="mt-4 ml-11">
          <div className="border border-border rounded-lg overflow-hidden">
            <iframe
              src={getOpenStreetMapUrl()!}
              width="100%"
              height="200"
              style={{ border: 0 }}
              loading="lazy"
              title={`Mapa de ${location.name}`}
              className="w-full"
            />
          </div>
          <p className="text-xs text-text-secondary mt-2 ml-1">
            Mapa proporcionado por OpenStreetMap
          </p>
        </div>
      )}
    </div>
  )
}