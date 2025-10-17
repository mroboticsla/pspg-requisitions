'use client';

// =====================================================
// Componente CurrencyInput - Entrada de moneda con selector y formato
// =====================================================

import React, { useState, useEffect } from 'react';

// Monedas soportadas
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
  { code: 'CAD', symbol: '$', name: 'Dólar canadiense' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino' },
  { code: 'CLP', symbol: '$', name: 'Peso chileno' },
  { code: 'PEN', symbol: 'S/', name: 'Sol peruano' },
  { code: 'BRL', symbol: 'R$', name: 'Real brasileño' },
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

  // Formatear número con separadores de miles y decimales
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Parsear string a número (eliminar formato)
  const parseNumber = (str: string): number | null => {
    if (!str || str.trim() === '') return null;
    
    // Remover separadores de miles y reemplazar coma decimal por punto
    const cleaned = str.replace(/,/g, '').replace(/\s/g, '');
    const num = parseFloat(cleaned);
    
    return isNaN(num) ? null : num;
  };

  // Sincronizar displayValue cuando cambia value.amount externamente
  useEffect(() => {
    if (value.amount !== null && value.amount !== undefined) {
      setDisplayValue(formatNumber(value.amount));
    } else {
      setDisplayValue('');
    }
  }, [value.amount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Permitir solo números, puntos y comas
    const sanitized = input.replace(/[^\d.,]/g, '');
    
    setDisplayValue(sanitized);
    
    const parsedAmount = parseNumber(sanitized);
    onChange({
      amount: parsedAmount,
      currency: value.currency || 'USD',
    });
  };

  const handleAmountBlur = () => {
    // Formatear al perder el foco
    if (value.amount !== null && value.amount !== undefined) {
      setDisplayValue(formatNumber(value.amount));
    }
  };

  const handleAmountFocus = () => {
    // Al hacer foco, mostrar sin formato para facilitar la edición
    if (value.amount !== null && value.amount !== undefined) {
      setDisplayValue(value.amount.toString());
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
        {/* Selector de moneda */}
        <div className="w-32 flex-shrink-0">
          <select
            value={value.currency || 'USD'}
            onChange={handleCurrencyChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Input de cantidad */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{selectedCurrency?.symbol}</span>
          </div>
          <input
            type="text"
            id={id}
            name={name}
            value={displayValue}
            onChange={handleAmountChange}
            onBlur={handleAmountBlur}
            onFocus={handleAmountFocus}
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
