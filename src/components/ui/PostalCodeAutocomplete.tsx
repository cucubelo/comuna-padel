"use client";

import React, { useState, useEffect, useRef } from "react";
import { searchPostalCodes, validatePostalCode, PostalCode } from "@/lib/postalCodeService";
import { getAllCountries, getCountryByCode, Country } from "@/lib/countryService";

interface PostalCodeAutocompleteProps {
  value?: string;
  countryCode?: string;
  onChange: (postalCode: PostalCode | null) => void;
  onCountryChange?: (country: Country) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showCountrySelector?: boolean;
}

export default function PostalCodeAutocomplete({
  value = "",
  countryCode = "",
  onChange,
  onCountryChange,
  placeholder = "Buscar código postal...",
  className = "",
  disabled = false,
  showCountrySelector = true
}: PostalCodeAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [results, setResults] = useState<PostalCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showCountries, setShowCountries] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const countriesRef = useRef<HTMLDivElement>(null);

  // Cargar países al montar el componente
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const allCountries = await getAllCountries();
        setCountries(allCountries);
        
        // Si hay un countryCode inicial, buscar el país
        if (countryCode) {
          const country = await getCountryByCode(countryCode);
          if (country) {
            setSelectedCountry(country);
          }
        }
      } catch (error) {
        console.error('Error loading countries:', error);
      }
    };
    
    loadCountries();
  }, [countryCode]);

  // Actualizar query cuando cambia el value prop (solo si no está siendo editado)
  useEffect(() => {
    if (value !== query && !inputRef.current?.matches(':focus')) {
      setQuery(value);
    }
  }, [value, query]);

  // Función de búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!query.trim() || query.length < 2 || !selectedCountry) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      // No abrir automáticamente si el query es igual al value inicial
      if (query === value && value.length > 0) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await searchPostalCodes(query.trim(), selectedCountry.country_code);
        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Error searching postal codes:", error);
        setError('Error al buscar códigos postales');
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, selectedCountry, value]);

  // Manejar selección de país
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountries(false);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onChange(null);
    onCountryChange?.(country);
    
    // Enfocar el input después de seleccionar país
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Manejar selección de código postal
  const handleSelect = (postalCode: PostalCode) => {
    setQuery(postalCode.postal_code);
    setIsOpen(false);
    setSelectedIndex(-1);
    onChange(postalCode);
  };

  // Manejar teclas de navegación
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Solo interceptar teclas de navegación si el dropdown está abierto Y hay resultados
    if (!isOpen || results.length === 0) return;

    // Solo interceptar teclas específicas de navegación
    if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
      return; // Permitir que otras teclas (números, letras) se procesen normalmente
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setShowCountries(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Validar formato del código postal
  const isValidFormat = selectedCountry && query.length > 0 
    ? (() => {
        // Extraer solo el código postal del query (antes del primer " - " si existe)
        const postalCodeOnly = query.split(' - ')[0].trim();
        return validatePostalCode(postalCodeOnly, selectedCountry.country_code);
      })()
    : true;

  // Obtener placeholder dinámico
  const getDynamicPlaceholder = () => {
    if (selectedCountry) {
      return `Código postal para ${selectedCountry.country_name}`;
    }
    return placeholder || 'Primero selecciona un país';
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Selector de País */}
      {showCountrySelector && (
        <div className="mb-3">
          <label className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
            País
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCountries(!showCountries)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main text-left disabled:bg-bg-secondary disabled:text-text-secondary disabled:cursor-not-allowed"
            >
              {selectedCountry ? (
                <span className="flex items-center">
                  <span className="mr-2">{selectedCountry.flag_emoji}</span>
                  {selectedCountry.country_name}
                </span>
              ) : (
                <span className="text-text-secondary">Seleccionar país...</span>
              )}
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </button>

            {/* Lista de países */}
            {showCountries && (
              <div
                ref={countriesRef}
                className="absolute z-50 mt-1 w-full bg-bg-main border border-border shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none"
              >
                {countries.map((country) => (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full text-left px-4 py-2 hover:bg-accent-primary hover:bg-opacity-10 focus:bg-accent-primary focus:bg-opacity-10 focus:outline-none transition-colors font-open-sans text-text-main"
                  >
                    <span className="flex items-center">
                      <span className="mr-2">{country.flag_emoji}</span>
                      {country.country_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input de Código Postal */}
      <div className="relative">
       
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const newValue = e.target.value;
            setQuery(newValue);
            
            // Solo limpiar la confirmación si el usuario está editando un código postal ya confirmado
            // y el nuevo valor no es parte del proceso de escritura normal
            if (value && value.includes(' - ') && newValue !== value && !newValue.includes(value.split(' - ')[0])) {
              onChange(null);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            // Seleccionar todo el texto cuando se hace focus
            e.target.select();
            if (results.length > 0) setIsOpen(true);
          }}
          onBlur={() => {
            // Delay para permitir clicks en resultados
            setTimeout(() => {
              setIsOpen(false);
              setShowCountries(false);
            }, 200);
          }}
          placeholder={getDynamicPlaceholder()}
          disabled={disabled || (showCountrySelector && !selectedCountry)}
          className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main disabled:bg-bg-secondary disabled:text-text-secondary disabled:cursor-not-allowed ${
            !isValidFormat ? 'border-red-300 text-red-900' : 'border-border'
          }`}
        />
        
        {/* Indicador de carga */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-primary"></div>
          </div>
        )}

        {/* Mensaje de error de formato */}
        {!isValidFormat && selectedCountry && query.length > 0 && (
          <p className="mt-1 text-sm text-red-600 font-open-sans">
            Formato inválido para {selectedCountry.country_name}
          </p>
        )}

        {/* Mensaje de error general */}
        {error && (
          <p className="mt-1 text-sm text-red-600 font-open-sans">{error}</p>
        )}
      </div>

      {/* Resultados */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-bg-main border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {results.map((postalCode, index) => (
            <div
              key={`${postalCode.postal_code}-${postalCode.place_name}`}
              onClick={() => handleSelect(postalCode)}
              className={`px-4 py-3 cursor-pointer transition-colors font-open-sans ${
                index === selectedIndex 
                  ? "bg-accent-primary text-bg-main border-l-4 border-accent-primary shadow-sm" 
                  : "hover:bg-bg-secondary hover:bg-opacity-80"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${
                    index === selectedIndex ? "text-bg-main" : "text-text-main"
                  }`}>
                    {postalCode.postal_code} - {postalCode.place_name}
                  </div>
                  <div className={`text-sm ${
                    index === selectedIndex ? "text-bg-secondary" : "text-text-secondary"
                  }`}>
                    {[postalCode.admin_name3, postalCode.admin_name2, postalCode.admin_name1]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
                <div className={`text-xs ${
                  index === selectedIndex ? "text-bg-secondary" : "text-text-secondary"
                }`}>
                  {selectedCountry?.flag_emoji}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {isOpen && !isLoading && results.length === 0 && query.length >= 2 && selectedCountry && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-gray-500 text-center">
            No se encontraron códigos postales para &quot;{query}&quot; en {selectedCountry.country_name}
          </div>
        </div>
      )}
    </div>
  );
}