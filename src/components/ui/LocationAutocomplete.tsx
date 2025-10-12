'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Globe } from 'lucide-react'
import { locationService, Location } from '@/lib/locationService'
import { cn } from '@/lib/utils'

interface LocationAutocompleteProps {
  value?: string
  onChange?: (location: Location | null) => void
  onLocationSelect?: (location: Location | null) => void
  onInputChange?: (value: string) => void
  placeholder?: string
  showCountryFlags?: boolean
  disabled?: boolean
  required?: boolean
  className?: string
  countryFilter?: string
  // Nuevas props para el selector de país
  selectedCountry?: string
  onCountryChange?: (countryCode: string) => void
  showCountrySelector?: boolean
}

export default function LocationAutocomplete({
  value = '',
  onChange,
  onLocationSelect,
  onInputChange,
  placeholder = 'Buscar ubicación...',
  showCountryFlags = true,
  disabled = false,
  required = false,
  className = '',
  countryFilter,
  // Nuevas props para el selector de país
  selectedCountry = '',
  onCountryChange,
  showCountrySelector = true
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [countries, setCountries] = useState<Array<{ code: string; name: string; flag: string }>>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Función para manejar la selección de ubicación
  const handleLocationSelect = useCallback((location: Location | null) => {
    if (onChange) onChange(location)
    if (onLocationSelect) onLocationSelect(location)
  }, [onChange, onLocationSelect])

  // Actualizar valor interno cuando cambia el prop value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Cargar países soportados al montar el componente
  useEffect(() => {
    if (showCountrySelector) {
      const supportedCountries = locationService.getSupportedCountries()
      setCountries(supportedCountries)
    }
  }, [showCountrySelector])

  // Crear función de búsqueda con debounce
  const searchFunction = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      // Usar el país seleccionado como filtro si está disponible
      const countryToFilter = selectedCountry || countryFilter;
      const locations = await locationService.searchLocations(searchTerm, countryToFilter);
      
      setSuggestions(locations);
      
      // Abrir dropdown solo si hay resultados
      const shouldOpen = locations.length > 0;
      setIsOpen(shouldOpen);
      
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCountry, countryFilter]);

  // Debounce para búsqueda - optimizado para evitar búsquedas excesivas
  useEffect(() => {
    if (inputValue.length >= 2) {
      // Debounce de 500ms para evitar búsquedas en cada tecla
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
  }, [inputValue, searchFunction]);

  // Cerrar dropdown al hacer clic fuera
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
    
    if (onInputChange) {
      onInputChange(newValue);
    }

    if (newValue.trim() === '') {
      setSuggestions([]);
      setSelectedIndex(-1);
      setIsOpen(false);
      handleLocationSelect(null);
    }
    // El dropdown se abrirá automáticamente cuando lleguen los resultados en searchFunction
  };

  const selectLocation = (location: Location) => {
    setInputValue(location.display_name)
    setIsOpen(false)
    setSuggestions([])
    setSelectedIndex(-1)
    handleLocationSelect(location)
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
    // Cerrar dropdown con un pequeño delay para permitir clicks
    setTimeout(() => {
      setIsOpen(false)
      setSelectedIndex(-1)
    }, 150)
  }

  const handleClick = () => {
    // Abrir dropdown si hay suggestions al hacer click
    if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  // Solo mostrar suggestions de búsqueda, no ubicaciones populares
  const displaySuggestions = suggestions

  // Debug render - solo para desarrollo
  if (process.env.NODE_ENV === 'development') {
    // Logs mínimos solo en desarrollo
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Selector de País */}
      {showCountrySelector && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            País
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => {
              const newCountry = e.target.value
              if (onCountryChange) {
                onCountryChange(newCountry)
              }
              // Limpiar búsqueda actual cuando cambia el país
              if (newCountry !== selectedCountry) {
                setInputValue('')
                setSuggestions([])
                setIsOpen(false)
                if (onInputChange) onInputChange('')
              }
            }}
            className={cn(
              "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:bg-gray-50 disabled:text-gray-500",
              "bg-white"
            )}
            disabled={disabled}
          >
            <option value="">Seleccionar país...</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Input de Ubicación */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ubicación
        </label>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleClick}
          placeholder={selectedCountry ? `Buscar en ${countries.find(c => c.code === selectedCountry)?.name || 'país seleccionado'}...` : placeholder}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:bg-gray-50 disabled:text-gray-500",
            className
          )}
          disabled={disabled || (!selectedCountry && showCountrySelector)}
          required={required}
          autoComplete="off"
        />
        
        {/* Indicador de carga */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {isOpen && displaySuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {displaySuggestions.map((location, index) => (
            <button
              key={`${location.name}-${location.country_code}-${index}`}
              type="button"
              onClick={() => selectLocation(location)}
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                "flex items-center space-x-3",
                selectedIndex === index && "bg-blue-50 text-blue-700"
              )}
            >
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {location.name}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {location.display_name}
                </div>
              </div>
              
              {showCountryFlags && location.country_code && (
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <span className="text-sm">
                    {locationService.getCountryInfo(location.country_code)?.flag || '🌍'}
                  </span>
                  <span className="text-xs text-gray-400 uppercase">
                    {location.country_code}
                  </span>
                </div>
              )}
            </button>
          ))}
          
          {suggestions.length === 0 && inputValue.length >= 2 && !isLoading && (
            <div className="px-3 py-4 text-center text-gray-500">
              <Globe className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No se encontraron ubicaciones</p>
              <p className="text-xs text-gray-400 mt-1">
                Intenta con otro término de búsqueda
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}