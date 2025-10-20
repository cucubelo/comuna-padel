'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Globe, Building2, Dumbbell } from 'lucide-react'
import { sportsLocationService, type SportsLocationResult } from '@/lib/sportsLocationService'
import { cn } from '@/lib/utils'

interface LocationAutocompleteProps {
  value?: string
  onChange?: (location: SportsLocationResult | null) => void
  onLocationSelect?: (location: SportsLocationResult | null) => void
  onInputChange?: (value: string) => void
  placeholder?: string
  showCountryFlags?: boolean
  disabled?: boolean
  required?: boolean
  className?: string
  countryFilter?: string
  regionFilter?: string // Prop para filtrar por región/comunidad
  cityFilter?: string // Nueva prop para filtrar por ciudad específica
  // Nueva prop para información del grupo
  groupLocationInfo?: {
    city?: string
    region?: string
    coordinates?: { lat: number; lng: number }
  }
  // Nueva prop para búsqueda deportiva
  sportsMode?: boolean
  // Nueva prop para evitar búsquedas automáticas cuando se muestra un valor existente
  skipInitialSearch?: boolean
}

export default function LocationAutocomplete({
  value = '',
  onChange,
  onLocationSelect,
  onInputChange,
  placeholder = 'Buscar ubicación deportiva...',
  showCountryFlags = true,
  disabled = false,
  required = false,
  className = '',
  countryFilter,
  regionFilter, // Prop para filtrar por región
  cityFilter, // Nueva prop para filtrar por ciudad específica
  groupLocationInfo, // Nueva prop para información del grupo
  // Nueva prop para búsqueda deportiva
  sportsMode = true,
  // Nueva prop para evitar búsquedas automáticas
  skipInitialSearch = false
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<SportsLocationResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({})
  const [isSelecting, setIsSelecting] = useState(false) // Bandera para evitar búsquedas durante selección
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Función para manejar la selección de ubicación
  const handleLocationSelect = useCallback((location: SportsLocationResult | null) => {
    if (onChange) onChange(location)
    if (onLocationSelect) onLocationSelect(location)
  }, [onChange, onLocationSelect])

  // Cargar categorías dinámicamente al montar el componente
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await sportsLocationService.getAvailableCategories()
        const labelsMap = categories.reduce((acc, category) => {
          acc[category.value] = category.label
          return acc
        }, {} as Record<string, string>)
        setCategoryLabels(labelsMap)
      } catch (error) {
        console.error('Error loading categories:', error)
        // Fallback a categorías hardcodeadas en caso de error
        setCategoryLabels({
          'club_tenis': 'Club de Tenis',
          'club_padel': 'Club de Pádel',
          'club_deportivo': 'Club Deportivo',
          'gimnasio': 'Gimnasio',
          'polideportivo': 'Polideportivo',
          'centro_fitness': 'Centro de Fitness',
          'piscina': 'Piscina',
          'campo_futbol': 'Campo de Fútbol'
        })
      }
    }

    loadCategories()
  }, [])

  // Actualizar valor interno cuando cambia el prop value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Crear función de búsqueda con debounce
  const searchFunction = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      // Usar el país del filtro para búsquedas más precisas
      const locations = await sportsLocationService.searchSportsLocations(
        searchTerm,
        countryFilter || 'ES', // Usar España como default si no hay filtro
        8, // Limitar a 8 resultados
        regionFilter, // Pasar el filtro de región
        cityFilter, // Pasar el filtro de ciudad
        groupLocationInfo // Pasar información del grupo para mejorar la búsqueda
      );

      setSuggestions(locations);
      
      // Solo abrir si hay resultados
      const shouldOpen = locations.length > 0;
      setIsOpen(shouldOpen);

    } catch (error) {
      console.error('Error searching sports locations:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [countryFilter, regionFilter, cityFilter, groupLocationInfo]);

  // Efecto para búsqueda con debounce
  useEffect(() => {
    // No buscar si estamos en proceso de selección
    if (isSelecting) {
      return;
    }

    // No buscar si skipInitialSearch está activado y el valor coincide con el prop value inicial
    if (skipInitialSearch && inputValue === value && value.length > 0) {
      return;
    }

    if (inputValue.length >= 2) {
      // Debounce de 500ms para evitar demasiadas llamadas
      const timeoutId = setTimeout(() => {
        searchFunction(inputValue);
      }, 500);

      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [inputValue, searchFunction, isSelecting, skipInitialSearch, value]);

  // Manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Si el usuario está escribiendo, desactivar la bandera de selección
    if (isSelecting) {
      setIsSelecting(false);
    }

    if (onInputChange) {
      onInputChange(newValue);
    }

    if (newValue.trim() === '') {
      setSuggestions([]);
      setSelectedIndex(-1);
      setIsOpen(false);
      handleLocationSelect(null);
    }

  };

  const selectLocation = async (location: SportsLocationResult) => {
    setIsSelecting(true) // Activar bandera para evitar búsquedas
    setInputValue(location.name)
    setIsOpen(false)
    setSuggestions([])
    setSelectedIndex(-1)

    // Incrementar contador de uso
    await sportsLocationService.incrementUsageCount(location.id, location.source)

    // Si es de Google Places, guardarlo localmente
    if (location.source === 'google') {
      try {
        const savedId = await sportsLocationService.saveSportsLocationFromGoogle(location)
        if (savedId) {
          // Actualizar el ID y source de la ubicación
          location.id = savedId
          location.source = 'local'
        }
      } catch (error) {
        console.error('Error saving Google Places location:', error)
      }
    }
    
    handleLocationSelect(location)
    
    // La bandera se desactivará cuando el usuario empiece a escribir de nuevo
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Solo usar suggestions de búsqueda, no popularLocations
    const currentSuggestions = suggestions

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < currentSuggestions.length - 1 ? prev + 1 : 0
        )
        setIsOpen(true)
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : currentSuggestions.length - 1
        )
        setIsOpen(true)
        break
      
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < currentSuggestions.length) {
          selectLocation(currentSuggestions[selectedIndex]);
        }
        break
      
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleFocus = () => {
    // Solo abrir si hay suggestions de búsqueda, no automáticamente
    if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  const handleBlur = () => {
    // Delay para permitir clicks en el dropdown
    setTimeout(() => {
      setIsOpen(false)
      setSelectedIndex(-1)
    }, 150)
  }

  const handleClick = () => {
    // Solo abrir si hay suggestions de búsqueda
    if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  // Usar solo las suggestions de búsqueda
  const displaySuggestions = suggestions

  // Función para obtener el icono según la categoría deportiva
  const getLocationIcon = (location: SportsLocationResult) => {
    switch (location.category) {
      case 'club_tenis':
        return <Dumbbell className="h-4 w-4 text-green-500 flex-shrink-0" />
      case 'club_padel':
        return <Dumbbell className="h-4 w-4 text-accent-primary flex-shrink-0" />
      case 'gimnasio':
      case 'centro_fitness':
        return <Dumbbell className="h-4 w-4 text-blue-500 flex-shrink-0" />
      case 'polideportivo':
        return <Building2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
      case 'club_deportivo':
        return <Building2 className="h-4 w-4 text-orange-500 flex-shrink-0" />
      default:
        return <MapPin className="h-4 w-4 text-text-secondary flex-shrink-0" />
    }
  }

  // Función para obtener el texto descriptivo del tipo de lugar
  const getLocationTypeText = (location: SportsLocationResult) => {
    return categoryLabels[location.category] || 'Centro Deportivo'
  }

  const getCountryName = (countryCode: string): string => {
    const countryNames: Record<string, string> = {
      'ES': 'España',
      'AR': 'Argentina',
      'MX': 'México',
      'CO': 'Colombia',
      'CL': 'Chile',
      'PE': 'Perú',
      'EC': 'Ecuador',
      'VE': 'Venezuela',
      'UY': 'Uruguay',
      'PY': 'Paraguay',
      'BO': 'Bolivia',
      'BR': 'Brasil'
    }
    return countryNames[countryCode] || countryCode
  }

  const getCountryInfo = (countryCode: string) => {
    const countryData: Record<string, { name: string; flag: string }> = {
      'ES': { name: 'España', flag: '🇪🇸' },
      'AR': { name: 'Argentina', flag: '🇦🇷' },
      'MX': { name: 'México', flag: '🇲🇽' },
      'CO': { name: 'Colombia', flag: '🇨🇴' },
      'CL': { name: 'Chile', flag: '🇨🇱' },
      'PE': { name: 'Perú', flag: '🇵🇪' },
      'EC': { name: 'Ecuador', flag: '🇪🇨' },
      'VE': { name: 'Venezuela', flag: '🇻🇪' },
      'UY': { name: 'Uruguay', flag: '🇺🇾' },
      'PY': { name: 'Paraguay', flag: '🇵🇾' },
      'BO': { name: 'Bolivia', flag: '🇧🇴' },
      'BR': { name: 'Brasil', flag: '🇧🇷' }
    }
    return countryData[countryCode] || { name: countryCode, flag: '🌍' }
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={handleClick}
            placeholder={placeholder}
            className={cn(
              "w-full pl-10 pr-10 py-2.5 border border-border rounded-lg shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary",
              "disabled:bg-bg-secondary disabled:text-text-secondary disabled:cursor-not-allowed",
              "bg-bg-main text-text-main font-open-sans placeholder:text-text-secondary",
              "transition-colors duration-200",
              // Responsive design
              "text-base sm:text-sm", // Larger text on mobile for better readability
              "min-h-[44px] sm:min-h-[40px]", // Larger touch targets on mobile
              className
            )}
            disabled={disabled}
            required={required}
            autoComplete="off"
          />
          
          {/* Icono de ubicación */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <MapPin className="h-4 w-4 text-text-secondary" />
          </div>
          
          {/* Indicador de carga */}
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent-primary border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown de sugerencias */}
      {isOpen && displaySuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 w-full mt-1 bg-bg-main border border-border rounded-lg shadow-lg",
            "max-h-60 overflow-auto",
            // Responsive design
            "max-h-48 sm:max-h-60", // Smaller max height on mobile to prevent viewport issues
            "shadow-xl sm:shadow-lg" // Stronger shadow on mobile for better visibility
          )}
        >
          {displaySuggestions.map((location, index) => (
            <button
              key={`${location.name}-${location.country_code}-${index}`}
              type="button"
              onClick={() => selectLocation(location)}
              className={cn(
                "w-full px-3 py-3 sm:py-2 text-left hover:bg-bg-secondary focus:bg-bg-secondary focus:outline-none",
                "flex items-center space-x-3",
                "transition-colors duration-150",
                // Responsive design
                "active:bg-accent-primary/10", // Visual feedback on mobile tap
                "min-h-[52px] sm:min-h-[auto]", // Larger touch targets on mobile
                selectedIndex === index && "bg-accent-primary/10 text-accent-primary"
              )}
            >
              {getLocationIcon(location)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-text-main truncate font-open-sans text-sm sm:text-sm">
                    {location.name}
                  </span>
                  {getLocationTypeText(location) && (
                    <span className="text-xs bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded-full font-open-sans flex-shrink-0">
                      {getLocationTypeText(location)}
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-text-secondary truncate font-open-sans">
                  {location.address}
                </div>
              </div>
              
              {showCountryFlags && location.country_code && (
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <span className="text-sm">
                    {getCountryInfo(location.country_code)?.flag || '🌍'}
                  </span>
                  <span className="text-xs text-text-secondary uppercase font-open-sans">
                    {location.country_code}
                  </span>
                </div>
              )}
            </button>
          ))}
          
          {suggestions.length === 0 && inputValue.length >= 2 && !isLoading && (
            <div className="px-3 py-6 sm:py-4 text-center text-text-secondary">
              <Globe className="h-8 w-8 mx-auto mb-2 text-text-secondary/50" />
              <p className="text-sm font-open-sans">No se encontraron ubicaciones</p>
              <p className="text-xs text-text-secondary/70 mt-1 font-open-sans">
                Intenta con otro término de búsqueda
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}