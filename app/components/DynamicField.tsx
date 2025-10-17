'use client';

// =====================================================
// Componente DynamicField - Renderiza campos dinámicos según configuración
// =====================================================

import React from 'react';
import type { FormField, FieldValidation } from '@/lib/types/requisitions';
import { CurrencyInput, type CurrencyValue } from './CurrencyInput';

interface DynamicFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function DynamicField({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: DynamicFieldProps) {
  const isRequired = field.validation?.required || false;

  // Renderizar según el tipo de campo
  const renderField = () => {
    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.field_type}
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            required={isRequired}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            required={isRequired}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder}
            disabled={disabled}
            required={isRequired}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={isRequired}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={isRequired}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Seleccione una opción</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multi-select':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== option));
                    }
                  }}
                  disabled={disabled}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={disabled}
                  required={isRequired}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              required={isRequired}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={field.name} className="text-sm text-gray-700">
              {field.label}
            </label>
          </div>
        );

      case 'currency':
        const currencyValue: CurrencyValue = value || { amount: null, currency: 'USD' };
        return (
          <CurrencyInput
            id={field.name}
            name={field.name}
            value={currencyValue}
            onChange={onChange}
            disabled={disabled}
            required={isRequired}
            placeholder={field.placeholder || '0.00'}
            error={error}
          />
        );

      default:
        return <p className="text-red-500">Tipo de campo no soportado: {field.field_type}</p>;
    }
  };

  return (
    <div className="mb-4">
      {field.field_type !== 'checkbox' && (
        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {renderField()}

      {field.help_text && (
        <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Componente para renderizar una sección completa con sus campos
interface DynamicSectionProps {
  section: {
    id: string;
    name: string;
    description?: string;
    is_required: boolean;
    fields: FormField[];
  };
  values: Record<string, any>;
  onChange: (sectionId: string, fieldName: string, value: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function DynamicSection({
  section,
  values,
  onChange,
  errors = {},
  disabled = false,
}: DynamicSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {section.name}
          {section.is_required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {section.description && (
          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {section.fields
          .sort((a, b) => a.position - b.position)
          .map((field) => (
            <DynamicField
              key={field.id}
              field={field}
              value={values[field.name]}
              onChange={(value) => onChange(section.id, field.name, value)}
              error={errors[field.name]}
              disabled={disabled}
            />
          ))}
      </div>
    </div>
  );
}
