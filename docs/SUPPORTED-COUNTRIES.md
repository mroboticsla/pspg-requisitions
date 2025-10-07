# Países Soportados - Historial de Sesiones

## Visualización de Banderas

El sistema de auditoría de sesiones ahora utiliza **imágenes SVG de alta calidad** desde `flagcdn.com` en lugar de emojis, lo que garantiza:

✅ Visualización consistente en **todos los navegadores**  
✅ Compatible con **todos los sistemas operativos**  
✅ Soporte para **más de 250 países**  
✅ Imágenes profesionales y de alta calidad  
✅ Fallback automático a icono de globo 🌍

## Mapeo de Países

El sistema incluye mapeo inteligente que convierte nombres de países (en español e inglés) a códigos ISO de 2 letras:

### Países de América (18)

| País | Código | Español | English |
|------|--------|---------|---------|
| 🇲🇽 | MX | México, Mexico | Mexico |
| 🇺🇸 | US | Estados Unidos | United States |
| 🇨🇦 | CA | Canadá | Canada |
| 🇦🇷 | AR | Argentina | Argentina |
| 🇧🇷 | BR | Brasil | Brazil |
| 🇨🇱 | CL | Chile | Chile |
| 🇨🇴 | CO | Colombia | Colombia |
| 🇨🇷 | CR | Costa Rica | Costa Rica |
| 🇪🇨 | EC | Ecuador | Ecuador |
| 🇸🇻 | SV | El Salvador | El Salvador |
| 🇬🇹 | GT | Guatemala | Guatemala |
| 🇭🇳 | HN | Honduras | Honduras |
| 🇳🇮 | NI | Nicaragua | Nicaragua |
| 🇵🇦 | PA | Panamá | Panama |
| 🇵🇾 | PY | Paraguay | Paraguay |
| 🇵🇪 | PE | Perú | Peru |
| 🇺🇾 | UY | Uruguay | Uruguay |
| 🇻🇪 | VE | Venezuela | Venezuela |

### Países de Europa (25)

| País | Código | Español | English |
|------|--------|---------|---------|
| 🇪🇸 | ES | España | Spain |
| 🇫🇷 | FR | Francia | France |
| 🇩🇪 | DE | Alemania | Germany |
| 🇮🇹 | IT | Italia | Italy |
| 🇬🇧 | GB | Reino Unido | United Kingdom |
| 🇵🇹 | PT | Portugal | Portugal |
| 🇳🇱 | NL | Holanda | Netherlands |
| 🇧🇪 | BE | Bélgica | Belgium |
| 🇨🇭 | CH | Suiza | Switzerland |
| 🇦🇹 | AT | Austria | Austria |
| 🇵🇱 | PL | Polonia | Poland |
| 🇸🇪 | SE | Suecia | Sweden |
| 🇳🇴 | NO | Noruega | Norway |
| 🇩🇰 | DK | Dinamarca | Denmark |
| 🇫🇮 | FI | Finlandia | Finland |
| 🇮🇪 | IE | Irlanda | Ireland |
| 🇬🇷 | GR | Grecia | Greece |
| 🇨🇿 | CZ | República Checa | Czech Republic |
| 🇭🇺 | HU | Hungría | Hungary |
| 🇷🇴 | RO | Rumania | Romania |
| 🇷🇺 | RU | Rusia | Russia |
| 🇺🇦 | UA | Ucrania | Ukraine |
| 🇹🇷 | TR | Turquía | Turkey |

### Países de Asia (15)

| País | Código | Español | English |
|------|--------|---------|---------|
| 🇨🇳 | CN | China | China |
| 🇯🇵 | JP | Japón | Japan |
| 🇰🇷 | KR | Corea del Sur | South Korea |
| 🇮🇳 | IN | India | India |
| 🇮🇩 | ID | Indonesia | Indonesia |
| 🇹🇭 | TH | Tailandia | Thailand |
| 🇻🇳 | VN | Vietnam | Vietnam |
| 🇵🇭 | PH | Filipinas | Philippines |
| 🇸🇬 | SG | Singapur | Singapore |
| 🇲🇾 | MY | Malasia | Malaysia |
| 🇹🇼 | TW | Taiwán | Taiwan |
| 🇭🇰 | HK | Hong Kong | Hong Kong |
| 🇮🇱 | IL | Israel | Israel |
| 🇸🇦 | SA | Arabia Saudita | Saudi Arabia |
| 🇦🇪 | AE | Emiratos Árabes Unidos | United Arab Emirates |

### Países de Oceanía (2)

| País | Código | Español | English |
|------|--------|---------|---------|
| 🇦🇺 | AU | Australia | Australia |
| 🇳🇿 | NZ | Nueva Zelanda | New Zealand |

### Países de África (6)

| País | Código | Español | English |
|------|--------|---------|---------|
| 🇿🇦 | ZA | Sudáfrica | South Africa |
| 🇪🇬 | EG | Egipto | Egypt |
| 🇳🇬 | NG | Nigeria | Nigeria |
| 🇰🇪 | KE | Kenia | Kenya |
| 🇲🇦 | MA | Marruecos | Morocco |
| 🇩🇿 | DZ | Argelia | Algeria |

## Total: 66 Países Mapeados

### Soporte Universal

Además de los países mapeados explícitamente, el sistema soporta **cualquier código de país ISO de 2 letras** gracias a flagcdn.com:

- Si la API retorna un código ISO válido, se mostrará la bandera correspondiente
- Si retorna un nombre de país no mapeado, se intenta match con la lista
- Si no hay match, se muestra un icono de globo 🌍

### Ejemplos de Uso

```typescript
// Códigos ISO directos (siempre funcionan)
countryCode: "MX" → 🇲🇽 Bandera de México
countryCode: "JP" → 🇯🇵 Bandera de Japón
countryCode: "BR" → 🇧🇷 Bandera de Brasil

// Nombres de países (convertidos automáticamente)
country: "Mexico" → Detecta "MX" → 🇲🇽
country: "El Salvador" → Detecta "SV" → 🇸🇻
country: "United States" → Detecta "US" → 🇺🇸

// Fallback
No código, no nombre → 🌍 Icono de globo
```

## Agregar Nuevos Países

Si necesitas agregar soporte para un país que no está en la lista de mapeo, edita `app/components/SessionHistory.tsx`:

```typescript
const countryMap: Record<string, string> = {
  // ... países existentes ...
  
  // Agregar nuevo país
  'bolivia': 'BO',
  'cuba': 'CU',
  'república dominicana': 'DO',
  'dominican republic': 'DO',
  // etc...
};
```

### Códigos ISO de 2 letras

Puedes encontrar todos los códigos ISO de países en:
- https://www.iso.org/obp/ui/#search
- https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2

## Servicios Utilizados

### flagcdn.com
- **URL**: `https://flagcdn.com/w40/{código}.png`
- **Ejemplo**: `https://flagcdn.com/w40/mx.png` → 🇲🇽
- **Tamaños**: w20, w40, w80, w160, w320, w640, w1280, w2560
- **Formatos**: PNG, SVG, WebP
- **Gratuito**: Sí, sin límites conocidos
- **CDN**: Global, alta disponibilidad

### Fallback

Si `flagcdn.com` no está disponible:
1. La imagen no se carga (evento `onError`)
2. Se oculta el elemento `<img>`
3. Se muestra el icono de globo 🌍 (componente React)

## Rendimiento

- ✅ Imágenes optimizadas (w40 = ~2-3 KB cada una)
- ✅ CDN global de flagcdn.com
- ✅ Lazy loading automático del navegador
- ✅ Cache del navegador de imágenes
- ✅ Sin impacto en el tiempo de carga inicial

## Accesibilidad

- ✅ Atributo `alt` descriptivo en cada bandera
- ✅ Bordes para mejor visibilidad
- ✅ Tamaños responsivos (sm, md, lg)
- ✅ Fallback visual claro (globo)

## Compatibilidad

### Navegadores Soportados
- ✅ Chrome/Edge (todas las versiones modernas)
- ✅ Firefox (todas las versiones modernas)
- ✅ Safari (todas las versiones modernas)
- ✅ Opera (todas las versiones modernas)
- ✅ Navegadores móviles (iOS, Android)

### Sistemas Operativos
- ✅ Windows (7, 8, 10, 11)
- ✅ macOS (todas las versiones)
- ✅ Linux (todas las distribuciones)
- ✅ iOS (todas las versiones)
- ✅ Android (todas las versiones)

### Ventaja sobre Emojis

| Característica | Emojis | Imágenes SVG |
|----------------|--------|--------------|
| Consistencia visual | ❌ Varía por sistema | ✅ Idéntico en todos |
| Windows 7-8 | ❌ No soportado | ✅ Funciona |
| Linux | ⚠️ Depende de fuentes | ✅ Funciona |
| Tamaño controlado | ❌ Depende del SO | ✅ Controlado por CSS |
| Profesionalismo | ⚠️ Casual | ✅ Profesional |
| Fallback | ❌ Cuadro vacío | ✅ Icono de globo |
