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

// Lista de códigos de país comunes
export const COUNTRY_CODES = [
  { code: "+52", country: "MX", name: "México" },
  { code: "+1", country: "US", name: "Estados Unidos" },
  { code: "+1", country: "CA", name: "Canadá" },
  { code: "+54", country: "AR", name: "Argentina" },
  { code: "+56", country: "CL", name: "Chile" },
  { code: "+57", country: "CO", name: "Colombia" },
  { code: "+506", country: "CR", name: "Costa Rica" },
  { code: "+593", country: "EC", name: "Ecuador" },
  { code: "+503", country: "SV", name: "El Salvador" },
  { code: "+502", country: "GT", name: "Guatemala" },
  { code: "+504", country: "HN", name: "Honduras" },
  { code: "+505", country: "NI", name: "Nicaragua" },
  { code: "+507", country: "PA", name: "Panamá" },
  { code: "+595", country: "PY", name: "Paraguay" },
  { code: "+51", country: "PE", name: "Perú" },
  { code: "+598", country: "UY", name: "Uruguay" },
  { code: "+58", country: "VE", name: "Venezuela" },
  { code: "+34", country: "ES", name: "España" },
];

export default function PhoneInput({
  phoneCountry,
  phoneNumber,
  onCountryChange,
  onNumberChange,
  required = false,
  placeholder = "1234567890",
  className = "",
}: PhoneInputProps) {
  return (
    <div className={`flex items-stretch border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-accent focus-within:border-transparent transition-all ${className}`}>
      {/* Ícono de teléfono */}
      <span className="pl-3 flex items-center pointer-events-none">
        <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </span>

      {/* Selector de código de país */}
      <select
        value={phoneCountry}
        onChange={(e) => onCountryChange(e.target.value)}
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
        onChange={(e) => onNumberChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border-none focus:outline-none placeholder-gray-400 bg-transparent"
        aria-label="Número de teléfono"
      />
    </div>
  );
}
