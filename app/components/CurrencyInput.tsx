'use client';
/* eslint-disable @next/next/no-img-element */

// =====================================================
// Componente CurrencyInput - Entrada de moneda con selector y formato
// =====================================================

import React, { useState, useEffect, useRef } from 'react';

// Componente para mostrar la bandera del país
const CurrencyFlag = ({ countryCode }: { countryCode: string }) => {
  const flagUrl = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
  
  return (
    <img 
      src={flagUrl} 
      alt={`Bandera de ${countryCode}`}
      className="w-5 h-3.5 object-cover rounded-sm shadow-sm flex-shrink-0"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

// Monedas soportadas con sus códigos ISO de país para las banderas
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense', countryCode: 'us' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano', countryCode: 'mx' },
  { code: 'EUR', symbol: '€', name: 'Euro', countryCode: 'eu' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina', countryCode: 'gb' },
  { code: 'CAD', symbol: '$', name: 'Dólar canadiense', countryCode: 'ca' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano', countryCode: 'co' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino', countryCode: 'ar' },
  { code: 'CLP', symbol: '$', name: 'Peso chileno', countryCode: 'cl' },
  { code: 'PEN', symbol: 'S/', name: 'Sol peruano', countryCode: 'pe' },
  { code: 'BRL', symbol: 'R$', name: 'Real brasileño', countryCode: 'br' },
];

export interface CurrencyValue {
  amount: number | null;
  currency: string;
}

interface CurrencyInputProps {
  value: CurrencyValue;
  onChange: (value: CurrencyValue) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
  id?: string;
  name?: string;
}

export function CurrencyInput({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = '0.00',
  error,
  id,
  name,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isUserTyping, setIsUserTyping] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Formatear número con separadores de miles
  const formatThousands = (num: string): string => {
    // Separar parte entera y decimal
    const parts = num.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Formatear parte entera con separadores de miles
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Si hay parte decimal, agregarla
    return decimalPart !== undefined ? `${formatted}.${decimalPart}` : formatted;
  };

  // Parsear string a número (eliminar formato)
  const parseNumber = (str: string): number | null => {
    if (!str || str.trim() === '') return null;
    
    // Remover separadores de miles
    const cleaned = str.replace(/,/g, '');
    const num = parseFloat(cleaned);
    
    return isNaN(num) ? null : num;
  };

  // Sincronizar displayValue cuando cambia value.amount externamente (pero no cuando el usuario está escribiendo)
  useEffect(() => {
    // Solo actualizar si el usuario NO está escribiendo
    if (!isUserTyping) {
      if (value.amount !== null && value.amount !== undefined) {
        const formatted = formatThousands(value.amount.toFixed(2));
        setDisplayValue(formatted);
      } else {
        setDisplayValue('');
      }
    }
  }, [value.amount, isUserTyping]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUserTyping(true); // Marcar que el usuario está escribiendo
    
    const input = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    // Permitir solo números, punto decimal y comas (las comas se usan como separadores)
    let sanitized = input.replace(/[^\d.,]/g, '');
    
    // Asegurar solo un punto decimal
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limitar decimales a 2 dígitos
    if (parts.length === 2 && parts[1].length > 2) {
      sanitized = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    // Remover comas para procesar
    const withoutCommas = sanitized.replace(/,/g, '');
    
    // Si tiene punto decimal, mantener la estructura
    if (withoutCommas.includes('.')) {
      const [intPart, decPart] = withoutCommas.split('.');
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      sanitized = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt + '.';
    } else {
      // Solo formatear parte entera
      sanitized = withoutCommas.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    // Calcular nueva posición del cursor
    const oldCommaCount = displayValue.substring(0, cursorPosition).split(',').length - 1;
    const newCommaCount = sanitized.substring(0, cursorPosition).split(',').length - 1;
    const commasDiff = newCommaCount - oldCommaCount;
    
    setDisplayValue(sanitized);
    
    const parsedAmount = parseNumber(sanitized);
    onChange({
      amount: parsedAmount,
      currency: value.currency || 'USD',
    });
    
    // Restaurar posición del cursor considerando las comas agregadas/removidas
    setTimeout(() => {
      if (inputRef.current) {
        const newPosition = cursorPosition + commasDiff;
        inputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const handleAmountFocus = () => {
    setIsUserTyping(true); // Marcar que el usuario está interactuando con el campo
  };

  const handleAmountBlur = () => {
    setIsUserTyping(false); // El usuario ya no está escribiendo
    
    // Al perder el foco, asegurar formato con 2 decimales si hay un valor
    if (value.amount !== null && value.amount !== undefined) {
      const formatted = formatThousands(value.amount.toFixed(2));
      setDisplayValue(formatted);
    } else if (displayValue && !displayValue.includes('.')) {
      // Si escribió solo números sin decimal, agregar .00
      const num = parseNumber(displayValue);
      if (num !== null) {
        const formatted = formatThousands(num.toFixed(2));
        setDisplayValue(formatted);
        onChange({
          amount: num,
          currency: value.currency || 'USD',
        });
      }
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      amount: value.amount,
      currency: e.target.value,
    });
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === (value.currency || 'USD'));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Selector de moneda con banderas */}
        <div className="w-40 flex-shrink-0">
          <div className="relative">
            <select
              value={value.currency || 'USD'}
              onChange={handleCurrencyChange}
              disabled={disabled}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm appearance-none cursor-pointer"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            {/* Bandera superpuesta */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {selectedCurrency && <CurrencyFlag countryCode={selectedCurrency.countryCode} />}
            </div>
          </div>
        </div>

        {/* Input de cantidad */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{selectedCurrency?.symbol}</span>
          </div>
          <input
            type="text"
            ref={inputRef}
            id={id}
            name={name}
            value={displayValue}
            onChange={handleAmountChange}
            onFocus={handleAmountFocus}
            onBlur={handleAmountBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`w-full pl-8 pr-3 py-2 border ${
              error ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100`}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Hook helper para manejar valores de moneda en formularios
export function useCurrencyValue(initialValue?: CurrencyValue) {
  const [currencyValue, setCurrencyValue] = useState<CurrencyValue>(
    initialValue || { amount: null, currency: 'USD' }
  );

  return [currencyValue, setCurrencyValue] as const;
}
