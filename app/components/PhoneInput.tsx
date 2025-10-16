"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useEffect } from "react";
import { Phone, ChevronDown, Search, X } from "lucide-react";

interface PhoneInputProps {
  phoneCountry: string;
  phoneNumber: string;
  onCountryChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

// Componente para mostrar la bandera del país usando imágenes SVG
const CountryFlag = ({ countryCode }: { countryCode: string }) => {
  // Usar flagcdn.com para obtener banderas SVG de alta calidad
  const flagUrl = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
  
  return (
    <img 
      src={flagUrl} 
      alt={`Bandera de ${countryCode}`}
      className="w-6 h-4 object-cover rounded-sm shadow-sm flex-shrink-0"
      onError={(e) => {
        // Fallback si la imagen no carga
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

// Lista de códigos de país comunes con sus formatos
export const COUNTRY_CODES = [
  { code: "+52", country: "MX", name: "México", format: "(###) ###-####", length: 10 },
  { code: "+1", country: "US", name: "Estados Unidos", format: "(###) ###-####", length: 10 },
  { code: "+1", country: "CA", name: "Canadá", format: "(###) ###-####", length: 10 },
  { code: "+54", country: "AR", name: "Argentina", format: "## ####-####", length: 10 },
  { code: "+56", country: "CL", name: "Chile", format: "# ####-####", length: 9 },
  { code: "+57", country: "CO", name: "Colombia", format: "### ###-####", length: 10 },
  { code: "+506", country: "CR", name: "Costa Rica", format: "####-####", length: 8 },
  { code: "+593", country: "EC", name: "Ecuador", format: "## ###-####", length: 9 },
  { code: "+503", country: "SV", name: "El Salvador", format: "####-####", length: 8 },
  { code: "+502", country: "GT", name: "Guatemala", format: "####-####", length: 8 },
  { code: "+504", country: "HN", name: "Honduras", format: "####-####", length: 8 },
  { code: "+505", country: "NI", name: "Nicaragua", format: "####-####", length: 8 },
  { code: "+507", country: "PA", name: "Panamá", format: "####-####", length: 8 },
  { code: "+595", country: "PY", name: "Paraguay", format: "### ###-###", length: 9 },
  { code: "+51", country: "PE", name: "Perú", format: "### ###-###", length: 9 },
  { code: "+598", country: "UY", name: "Uruguay", format: "## ###-###", length: 8 },
  { code: "+58", country: "VE", name: "Venezuela", format: "###-###-####", length: 10 },
  { code: "+34", country: "ES", name: "España", format: "### ## ## ##", length: 9 },
];

// Función para formatear el número según la máscara del país
export const formatPhoneNumber = (value: string, countryCode: string): string => {
  // Encontrar la configuración del país
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  if (!country) return value;

  // Eliminar todos los caracteres que no sean dígitos
  const digits = value.replace(/\D/g, "");
  
  // Limitar al número máximo de dígitos para ese país
  const limitedDigits = digits.substring(0, country.length);
  
  // Aplicar el formato
  let formatted = "";
  let digitIndex = 0;
  
  for (let i = 0; i < country.format.length && digitIndex < limitedDigits.length; i++) {
    if (country.format[i] === "#") {
      formatted += limitedDigits[digitIndex];
      digitIndex++;
    } else {
      formatted += country.format[i];
    }
  }
  
  return formatted;
};

// Función para obtener solo los dígitos sin formato
export const getUnformattedPhone = (value: string): string => {
  return value.replace(/\D/g, "");
};

export default function PhoneInput({
  phoneCountry,
  phoneNumber,
  onCountryChange,
  onNumberChange,
  required = false,
  placeholder = "1234567890",
  className = "",
}: PhoneInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Enfocar el campo de búsqueda cuando se abre
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Filtrar países según el término de búsqueda
  const filteredCountries = COUNTRY_CODES.filter(country => {
    const search = searchTerm.toLowerCase();
    return (
      country.name.toLowerCase().includes(search) ||
      country.country.toLowerCase().includes(search) ||
      country.code.includes(search)
    );
  });

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCountries.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredCountries.length) {
          handleCountryChange(filteredCountries[highlightedIndex].code);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll automático al elemento resaltado
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  // Manejar el cambio de número con formato
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue, phoneCountry);
    onNumberChange(formatted);
  };

  // Manejar el cambio de país y reformatear el número existente
  const handleCountryChange = (newCountry: string) => {
    onCountryChange(newCountry);
    
    // Reformatear el número existente con el nuevo país
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, "");
      const reformatted = formatPhoneNumber(digits, newCountry);
      onNumberChange(reformatted);
    }
    
    // Cerrar dropdown y limpiar búsqueda
    setIsDropdownOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  // Obtener el placeholder dinámico según el país
  const getPlaceholder = (): string => {
    const country = COUNTRY_CODES.find(c => c.code === phoneCountry);
    return country?.format.replace(/#/g, "0") || placeholder;
  };

  // Obtener el país actual
  const currentCountry = COUNTRY_CODES.find(c => c.code === phoneCountry);

  return (
    <div className="relative">
      <div className={`flex items-stretch border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-accent focus-within:border-transparent transition-all ${className}`}>
        {/* Ícono de teléfono */}
        <span className="pl-3 flex items-center pointer-events-none">
          <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>

        {/* Selector de código de país con dropdown personalizado */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-1 pl-2 pr-1 py-2 border-none outline-none text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors bg-transparent min-w-[110px]"
            aria-label="Seleccionar código de país"
          >
            {currentCountry ? (
              <CountryFlag countryCode={currentCountry.country} />
            ) : (
              <span className="text-lg">🌍</span>
            )}
            <span className="font-semibold text-gray-700">{currentCountry?.code || phoneCountry}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Separador visual */}
        <div className="w-px bg-gray-300"></div>

        {/* Input del número de teléfono */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          required={required}
          placeholder={getPlaceholder()}
          className="flex-1 px-4 py-2 border-none focus:outline-none placeholder-gray-400 bg-transparent"
          aria-label="Número de teléfono"
        />
      </div>

      {/* Dropdown menu - Fuera del contenedor con overflow-hidden */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[99999]">
          {/* Campo de búsqueda */}
          <div className="p-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0); // Reset al primer elemento al buscar
                }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar país..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setHighlightedIndex(-1);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de países */}
          <div ref={listRef} className="max-h-80 overflow-y-auto bg-white rounded-b-lg">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => (
                <button
                  key={`${country.code}-${country.country}-${country.name}`}
                  type="button"
                  onClick={() => handleCountryChange(country.code)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between ${
                    index === highlightedIndex
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  } ${
                    country.code === phoneCountry && country.country === currentCountry?.country 
                      ? 'bg-brand-accent bg-opacity-10 border-l-2 border-brand-accent' 
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <CountryFlag countryCode={country.country} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">{country.name}</span>
                      <span className="text-xs text-gray-500">{country.format.replace(/#/g, '0')}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 ml-2 flex-shrink-0">{country.code}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No se encontraron países
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
