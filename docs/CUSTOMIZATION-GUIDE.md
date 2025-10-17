# 🎨 Guía de Personalización - Portal Público PSPG

## 📋 Checklist de Personalización

Esta guía te ayudará a personalizar el portal público con la información real de tu empresa.

---

## 1️⃣ INFORMACIÓN DE CONTACTO

### 📞 Teléfonos
**Archivos a modificar:**
- `app/components/public/layout/PublicFooter.tsx`
- `app/components/public/home/ScheduleSection.tsx`
- `app/contact/page.tsx`

**Buscar y reemplazar:**
```typescript
// CAMBIAR:
+507 6000-0000
+507 6000-0001

// POR:
+507 TU-NUMERO-REAL-1
+507 TU-NUMERO-REAL-2
```

### 📧 Emails
**Archivos a modificar:**
- `app/components/public/layout/PublicFooter.tsx`
- `app/components/public/home/ScheduleSection.tsx`
- `app/contact/page.tsx`

**Buscar y reemplazar:**
```typescript
// CAMBIAR:
info@pspg.com
contact@pspg.com

// POR:
info@tuempresa.com
contacto@tuempresa.com
```

### 📍 Dirección
**Archivos a modificar:**
- `app/components/public/layout/PublicFooter.tsx`
- `app/contact/page.tsx`

**Buscar y reemplazar:**
```typescript
// CAMBIAR:
Ciudad de Panamá, Panamá
Edificio Empresarial, Piso 10

// POR:
Tu dirección real
Tu edificio y piso
```

---

## 2️⃣ HORARIOS DE ATENCIÓN

### 🕐 Modificar Horarios
**Archivo:** `app/components/public/home/ScheduleSection.tsx`

**Línea ~13:**
```typescript
const scheduleItems = [
  { day: 'Lunes - Viernes', hours: '8:00 AM - 6:00 PM' },  // Modificar aquí
  { day: 'Sábados', hours: '9:00 AM - 1:00 PM' },         // Modificar aquí
  { day: 'Domingos y Feriados', hours: 'Cerrado' },       // Modificar aquí
];
```

---

## 3️⃣ CONTENIDO DEL HERO SLIDER

### 🎬 Cambiar Slides
**Archivo:** `app/components/public/home/HeroSlider.tsx`

**Línea ~11:**
```typescript
const slides: Slide[] = [
  {
    title: 'TU TÍTULO PRINCIPAL',              // Cambiar
    subtitle: 'TU SUBTÍTULO',                  // Cambiar
    description: 'Tu descripción',             // Cambiar
    image: 'URL_DE_TU_IMAGEN'                 // Cambiar
  },
  // Agregar más slides o modificar los existentes
];
```

### 📸 Recomendaciones para Imágenes
- **Dimensiones**: 1920x600px (mínimo)
- **Formato**: JPG optimizado o WebP
- **Peso**: < 200KB por imagen
- **Carpeta**: `/public/images/slider/`

**Ejemplo de uso con imágenes locales:**
```typescript
image: '/images/slider/hero-1.jpg'
```

---

## 4️⃣ SECCIÓN "ACERCA DE"

### 📝 Modificar Historia
**Archivo:** `app/components/public/home/AboutSection.tsx`

**Líneas ~50-65:**
```typescript
<h3 className="text-3xl font-bold text-gray-900 mb-6">
  Nuestra Historia
</h3>
<p className="text-gray-600 mb-4">
  REEMPLAZAR con tu historia real...
</p>
<p className="text-gray-600 mb-4">
  REEMPLAZAR con más detalles...
</p>
```

### 🎯 Modificar Características
**Líneas ~13-28:**
```typescript
const features = [
  {
    icon: Award,
    title: 'TUS AÑOS de Experiencia',        // Cambiar
    description: 'Tu descripción real'       // Cambiar
  },
  // ... modificar las 4 características
];
```

---

## 5️⃣ SERVICIOS

### 💼 Modificar Servicios
**Archivo:** `app/components/public/home/ServicesSection.tsx`

**Líneas ~7-40:**
```typescript
const services = [
  {
    icon: Search,                            // Puedes cambiar el icono
    title: 'Nombre de tu Servicio',         // Cambiar
    description: 'Descripción real'         // Cambiar
  },
  // ... modificar los 6 servicios
];
```

### 🎨 Iconos Disponibles (Lucide React)
Importa desde `'lucide-react'`:
- `Search`, `Briefcase`, `UserCheck`, `LineChart`
- `Building`, `Lightbulb`, `Users`, `Award`
- `TrendingUp`, `Target`, `Heart`, `Globe`
- Y muchos más en: https://lucide.dev/icons/

---

## 6️⃣ ESTADÍSTICAS

### 📊 Actualizar Números
**Archivo:** `app/components/public/home/StatsSection.tsx`

**Líneas ~7-30:**
```typescript
const stats = [
  {
    icon: Users,
    value: '5,000+',                         // TUS NÚMEROS REALES
    label: 'Profesionales Colocados',       // TU DESCRIPCIÓN
    color: 'from-blue-500 to-blue-600'
  },
  // ... actualizar las 4 estadísticas
];
```

---

## 7️⃣ EMPLEOS

### 💼 Agregar Empleos Reales
**Archivo:** `app/jobs/page.tsx`

**Líneas ~24-80:**
```typescript
const mockJobs: Job[] = [
  {
    id: 1,
    title: 'Título del Puesto Real',        // Cambiar
    company: 'Empresa Real',                // Cambiar
    location: 'Ubicación Real',             // Cambiar
    type: 'Tiempo Completo',                // Modificar
    salary: '$X,XXX - $X,XXX',             // Modificar
    description: 'Descripción real',        // Cambiar
    requirements: [                         // Modificar
      'Requisito 1',
      'Requisito 2',
      'Requisito 3'
    ],
    posted: 'Hace X días'                   // Modificar
  },
  // ... agregar más empleos reales
];
```

---

## 8️⃣ PÁGINA "ACERCA DE"

### 🎯 Misión y Visión
**Archivo:** `app/about/page.tsx`

**Líneas ~60-75:**
```typescript
<h2>Nuestra Misión</h2>
<p>
  REEMPLAZAR con tu misión real...
</p>

<h2>Nuestra Visión</h2>
<p>
  REEMPLAZAR con tu visión real...
</p>
```

### 💎 Valores
**Líneas ~15-40:**
```typescript
const values = [
  {
    icon: Heart,
    title: 'Tu Valor 1',                    // Cambiar
    description: 'Descripción del valor'   // Cambiar
  },
  // ... modificar los 6 valores
];
```

### 📅 Timeline
**Líneas ~45-55:**
```typescript
const milestones = [
  { year: '2010', event: 'Tu evento real' },  // Cambiar años y eventos
  { year: '2013', event: 'Tu evento real' },
  // ... agregar/modificar hitos
];
```

### 👥 Equipo
**Líneas ~180-220:**
```typescript
// Reemplazar fotos e información del equipo
<h3>Nombre Real</h3>
<p>Cargo Real</p>
<p>Bio real del miembro</p>
```

---

## 9️⃣ GOOGLE MAPS

### 🗺️ Configurar Ubicación Real
**Archivos:**
- `app/components/public/home/ContactForm.tsx` (línea ~220)
- `app/contact/page.tsx` (línea ~80)

**Pasos:**
1. Ve a: https://www.google.com/maps
2. Busca tu dirección
3. Haz clic en "Compartir" → "Insertar un mapa"
4. Copia el iframe URL
5. Reemplaza la URL del iframe:

```typescript
<iframe
  src="TU_URL_DE_GOOGLE_MAPS_AQUI"
  // ...resto del código
></iframe>
```

**Ejemplo:**
```typescript
src="https://www.google.com/maps/embed?pb=TU_CODIGO_AQUI"
```

---

## 🔟 IMÁGENES

### 📸 Estructura Recomendada
```
public/
  images/
    slider/
      hero-1.jpg        (1920x600px)
      hero-2.jpg
      hero-3.jpg
    about/
      team-1.jpg        (400x400px)
      team-2.jpg
      team-3.jpg
      history.jpg       (800x600px)
    logo/
      logo.png          (200x60px)
      logo-white.png
```

### 🔄 Reemplazar Imágenes de Unsplash

**Hero Slider** (`HeroSlider.tsx`):
```typescript
// CAMBIAR:
image: 'https://images.unsplash.com/...'
// POR:
image: '/images/slider/hero-1.jpg'
```

**About Section** (`AboutSection.tsx`):
```typescript
// CAMBIAR:
src="https://images.unsplash.com/..."
// POR:
src="/images/about/history.jpg"
```

**Team Photos** (`about/page.tsx`):
```typescript
// CAMBIAR:
src="https://images.unsplash.com/..."
// POR:
src="/images/about/team-1.jpg"
```

---

## 1️⃣1️⃣ REDES SOCIALES

### 🌐 Agregar Links Reales
**Archivo:** `app/components/public/layout/PublicFooter.tsx`

**Líneas ~25-35:**
```typescript
<a href="https://facebook.com/TU_PAGINA" ...>    // Cambiar URL
  <Facebook className="h-5 w-5" />
</a>
<a href="https://linkedin.com/company/TU_EMPRESA" ...>  // Cambiar URL
  <Linkedin className="h-5 w-5" />
</a>
<a href="https://twitter.com/TU_CUENTA" ...>     // Cambiar URL
  <Twitter className="h-5 w-5" />
</a>
```

---

## 1️⃣2️⃣ LOGO DE LA EMPRESA

### 🎨 Cambiar Logo
**Archivo:** `app/components/public/layout/PublicNavbar.tsx`

**Líneas ~20-25:**
```typescript
<Link href="/" className="flex items-center space-x-2">
  {/* OPCIÓN 1: Usar imagen */}
  <img 
    src="/images/logo/logo.png" 
    alt="PSPG Logo" 
    className="h-8 w-auto"
  />
  
  {/* OPCIÓN 2: Mantener icono + texto */}
  <Building2 className="h-8 w-8 text-blue-600" />
  <span className="text-xl font-bold text-gray-900">
    TU NOMBRE DE EMPRESA
  </span>
</Link>
```

**Mismo cambio en:** `PublicFooter.tsx`

---

## 1️⃣3️⃣ COLORES DE LA MARCA

### 🎨 Personalizar Colores
**Archivo:** `tailwind.config.js`

Si quieres cambiar los colores azules por los de tu marca:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#TU_COLOR_PRINCIPAL',
          secondary: '#TU_COLOR_SECUNDARIO',
          accent: '#TU_COLOR_ACENTO',
        }
      }
    }
  }
}
```

Luego reemplaza `blue-600` por `brand-primary` en los componentes.

---

## 1️⃣4️⃣ METADATA Y SEO

### 📄 Configurar Metadata
**Archivo:** `app/layout.tsx`

Agregar o modificar:
```typescript
export const metadata: Metadata = {
  title: 'PSPG Requisitions | Tu Tagline Aquí',
  description: 'Descripción de tu empresa para SEO (150-160 caracteres)',
  keywords: 'recruitment, headhunting, panama, tu keyword',
  openGraph: {
    title: 'PSPG Requisitions',
    description: 'Tu descripción',
    images: ['/images/og-image.jpg'],
  }
}
```

---

## ✅ CHECKLIST DE PERSONALIZACIÓN

Marca cada item conforme lo completes:

### Información Básica
- [ ] Teléfonos actualizados
- [ ] Emails actualizados
- [ ] Dirección física actualizada
- [ ] Horarios de atención actualizados

### Contenido
- [ ] Slides del hero personalizados
- [ ] Historia de la empresa escrita
- [ ] Misión y visión actualizadas
- [ ] Valores corporativos definidos
- [ ] Timeline de hitos actualizado
- [ ] Servicios personalizados
- [ ] Estadísticas reales

### Imágenes
- [ ] Logo de la empresa agregado
- [ ] Imágenes del slider reemplazadas
- [ ] Fotos del equipo agregadas
- [ ] Imágenes de about reemplazadas

### Integraciones
- [ ] Google Maps configurado
- [ ] Redes sociales vinculadas
- [ ] Enlaces de footer actualizados

### Empleos
- [ ] Empleos reales agregados
- [ ] Mock data eliminado

### SEO
- [ ] Metadata configurada
- [ ] Favicon personalizado
- [ ] Open Graph images

---

## 🚀 Próximos Pasos Después de Personalizar

1. **Probar todas las páginas**
   - Verificar que todo el contenido sea correcto
   - Probar en móvil, tablet y desktop

2. **Optimizar imágenes**
   - Comprimir todas las imágenes
   - Convertir a WebP si es posible

3. **Integrar backend**
   - Conectar formulario de contacto
   - API para empleos reales

4. **Configurar email**
   - Servicio de envío de emails (SendGrid, etc.)
   - Templates de notificación

5. **Agregar Analytics**
   - Google Analytics
   - Hotjar o similar

6. **SEO avanzado**
   - Sitemap.xml
   - robots.txt
   - Schema.org markup

---

## 📞 Ayuda

Si necesitas ayuda con la personalización:
1. Revisa la documentación completa en `README-PUBLIC-PORTAL.md`
2. Consulta los comentarios en el código
3. Revisa la guía de inicio rápido en `QUICKSTART-PUBLIC-PORTAL.md`

---

## ✨ ¡Éxito con tu Portal!

Recuerda: La personalización es iterativa. Empieza con lo básico (contacto, textos principales) y ve mejorando progresivamente.

**¡Tu portal público está listo para brillar! 🌟**
