// Test de las funciones helper
const COUNTRY_CODES = [
  { code: "+52", country: "MX", name: "México", format: "(###) ###-####", length: 10 },
  { code: "+1", country: "US", name: "Estados Unidos", format: "(###) ###-####", length: 10 },
  { code: "+1", country: "CA", name: "Canadá", format: "(###) ###-####", length: 10 },
];

const composePhoneCountryValue = (isoCode, dialCode) => {
  return `${isoCode.toUpperCase()}|${dialCode}`;
};

const parsePhoneCountryValue = (value) => {
  if (!value) {
    return { iso: "", dialCode: "" };
  }

  if (value.includes("|")) {
    const [iso, dialCode] = value.split("|");
    return { iso: iso.toUpperCase(), dialCode };
  }

  const match = COUNTRY_CODES.find(c => c.code === value);
  return { iso: match?.country ?? "", dialCode: value };
};

const getCountryByValue = (value) => {
  const { iso, dialCode } = parsePhoneCountryValue(value);

  if (iso) {
    const exact = COUNTRY_CODES.find(c => c.country === iso && c.code === dialCode);
    if (exact) return exact;

    const byIso = COUNTRY_CODES.find(c => c.country === iso);
    if (byIso) return byIso;
  }

  return COUNTRY_CODES.find(c => c.code === dialCode);
};

// Pruebas
console.log("\n=== PRUEBAS DE FUNCIONES HELPER ===\n");

// Test 1: Valor en formato nuevo
const test1 = "MX|+52";
console.log("Test 1 - Formato nuevo (MX|+52):");
console.log("  Parse:", parsePhoneCountryValue(test1));
console.log("  GetCountry:", getCountryByValue(test1));

// Test 2: Valor legacy
const test2 = "+52";
console.log("\nTest 2 - Formato legacy (+52):");
console.log("  Parse:", parsePhoneCountryValue(test2));
console.log("  GetCountry:", getCountryByValue(test2));

// Test 3: Estados Unidos (mismo código que Canadá)
const test3 = "US|+1";
console.log("\nTest 3 - Estados Unidos (US|+1):");
console.log("  Parse:", parsePhoneCountryValue(test3));
console.log("  GetCountry:", getCountryByValue(test3));

// Test 4: Canadá (mismo código que EE.UU.)
const test4 = "CA|+1";
console.log("\nTest 4 - Canadá (CA|+1):");
console.log("  Parse:", parsePhoneCountryValue(test4));
console.log("  GetCountry:", getCountryByValue(test4));

// Test 5: Compose
console.log("\nTest 5 - Compose:");
console.log("  MX +52:", composePhoneCountryValue("MX", "+52"));
console.log("  US +1:", composePhoneCountryValue("US", "+1"));
