/**
 * Utilidades para manejo de teléfonos
 * Compartidas entre cliente y servidor
 */

export interface PhoneCountryConfig {
  code: string;
  name: string;
  dialCode: string;
  length: number;
  format?: string;
}

export const PHONE_COUNTRIES: PhoneCountryConfig[] = [
  { code: "MX", name: "México", dialCode: "+52", length: 10 },
  { code: "US", name: "Estados Unidos", dialCode: "+1", length: 10 },
  { code: "CA", name: "Canadá", dialCode: "+1", length: 10 },
  { code: "ES", name: "España", dialCode: "+34", length: 9 },
  { code: "CO", name: "Colombia", dialCode: "+57", length: 10 },
  { code: "AR", name: "Argentina", dialCode: "+54", length: 10 },
  { code: "CL", name: "Chile", dialCode: "+56", length: 9 },
  { code: "PE", name: "Perú", dialCode: "+51", length: 9 },
];

/**
 * Compone el valor del país para el select
 * Formato: "CÓDIGO|+DIALCODE"
 */
export const composePhoneCountryValue = (code: string, dialCode: string): string => {
  return `${code}|${dialCode}`;
};

/**
 * Parsea el valor del país desde el select
 * Retorna: { dialCode } para compatibilidad con código existente
 */
export const parsePhoneCountryValue = (value: string): { code: string; dialCode: string } => {
  if (!value) {
    return { code: "MX", dialCode: "+52" };
  }
  
  const [code, dialCode] = value.split("|");
  return { code: code || "MX", dialCode: dialCode || "+52" };
};

/**
 * Obtiene la configuración de un país por su valor compuesto
 */
export const getCountryByValue = (value: string): PhoneCountryConfig | undefined => {
  const { code } = parsePhoneCountryValue(value);
  return PHONE_COUNTRIES.find((c) => c.code === code);
};

/**
 * Obtiene solo los dígitos de un número de teléfono
 * Elimina espacios, guiones, paréntesis, etc.
 */
export const getUnformattedPhone = (value: string): string => {
  return value.replace(/\D/g, "");
};

/**
 * Formatea un número de teléfono completo (con código de país)
 * desde phoneCountry y phoneNumber
 */
export const formatFullPhoneNumber = (phoneCountry: string, phoneNumber: string): string => {
  const { dialCode } = parsePhoneCountryValue(phoneCountry);
  const digits = getUnformattedPhone(phoneNumber);
  return `${dialCode}${digits}`;
};

/**
 * Valida que un número de teléfono tenga la longitud correcta
 * para el país seleccionado
 */
export const validatePhoneLength = (phoneCountry: string, phoneNumber: string): {
  isValid: boolean;
  expectedLength?: number;
  actualLength: number;
} => {
  const country = getCountryByValue(phoneCountry);
  const digits = getUnformattedPhone(phoneNumber);
  
  if (!country) {
    return {
      isValid: false,
      actualLength: digits.length
    };
  }

  return {
    isValid: digits.length === country.length,
    expectedLength: country.length,
    actualLength: digits.length
  };
};
