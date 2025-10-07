"use client";

import React from "react";
import { Phone } from "lucide-react";

interface PhoneInputProps {
  phoneCountry: string;
  phoneNumber: string;
  onCountryChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

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
  // Manejar el cambio de número con formato
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue, phoneCountry);
    onNumberChange(formatted);
  };

  // Manejar el cambio de país y reformatear el número existente
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    onCountryChange(newCountry);
    
    // Reformatear el número existente con el nuevo país
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, "");
      const reformatted = formatPhoneNumber(digits, newCountry);
      onNumberChange(reformatted);
    }
  };

  // Obtener el placeholder dinámico según el país
  const getPlaceholder = (): string => {
    const country = COUNTRY_CODES.find(c => c.code === phoneCountry);
    return country?.format.replace(/#/g, "0") || placeholder;
  };

  return (
    <div className={`flex items-stretch border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-accent focus-within:border-transparent transition-all ${className}`}>
      {/* Ícono de teléfono */}
      <span className="pl-3 flex items-center pointer-events-none">
        <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </span>

      {/* Selector de código de país */}
      <select
        value={phoneCountry}
        onChange={handleCountryChange}
        className="pl-2 pr-2 py-2 border-none outline-none text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors bg-transparent"
        aria-label="Código de país"
      >
        {COUNTRY_CODES.map((country) => (
          <option key={`${country.code}-${country.country}`} value={country.code}>
            {country.country} {country.code}
          </option>
        ))}
      </select>

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
  );
}
