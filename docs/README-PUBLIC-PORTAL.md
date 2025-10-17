# Portal Público - PSPG Requisitions

## Descripción General

El Portal Público es la cara pública de PSPG Requisitions, diseñado para presentar los servicios de la empresa, mostrar oportunidades laborales y facilitar el contacto con potenciales clientes y candidatos.

## Estructura del Portal

### Páginas Principales

#### 1. **Inicio** (`/public-home`)
Página landing principal que incluye:
- **Hero Slider**: Carrusel rotativo con 3 slides destacando los valores de la empresa
- **Sección Acerca de**: Presentación breve de la empresa con 4 características clave
- **Servicios**: Grid de 6 servicios principales ofrecidos
- **Horario de Atención**: Información de contacto y horarios
- **Formulario de Contacto**: Formulario completo con validación

#### 2. **Acerca de Nosotros** (`/about`)
Página informativa que incluye:
- Misión y Visión de la empresa
- Valores corporativos (6 valores principales)
- Timeline de hitos históricos (2010-2025)
- Sección del equipo con fotos y descripciones

#### 3. **Portal de Empleos** (`/jobs`)
Página de búsqueda de oportunidades laborales:
- Buscador con filtros (tipo de trabajo, ubicación)
- Listado de posiciones disponibles (mock data)
- Información detallada de cada posición
- Botón "Aplicar Ahora" para cada empleo
- CTA para enviar CV si no encuentra posición adecuada

#### 4. **Contáctenos** (`/contact`)
Página de contacto completa:
- Cards de información rápida (dirección, teléfono, email, horario)
- Formulario de contacto completo con validación
- Mapa de Google Maps integrado
- Sección de preguntas frecuentes (FAQ)

## Componentes Principales

### Layout
- **PublicNavbar**: Navegación separada del sistema administrativo
  - Menú responsive con hamburger menu en móvil
  - Enlaces a todas las secciones públicas
  - Botón destacado para "Consola de Administración"
  
- **PublicFooter**: Footer completo con:
  - Logo e información de la empresa
  - Enlaces rápidos de navegación
  - Información de contacto
  - Links a redes sociales
  - Links legales (política de privacidad, términos)

### Secciones del Home
- **HeroSlider**: Carrusel automático con transiciones suaves
  - Auto-play cada 5 segundos
  - Navegación manual con flechas
  - Indicadores de puntos (dots)
  - Imágenes de fondo con overlay oscuro
  - Animaciones fade-in para el contenido

- **AboutSection**: Sección "Acerca de"
  - 4 tarjetas de características
  - Grid responsive
  - Historia de la empresa con imagen
  - Animaciones hover en las tarjetas

- **ServicesSection**: Servicios ofrecidos
  - Grid de 6 servicios
  - Iconos de Lucide React
  - Efectos hover con transiciones
  - CTA section con gradiente

- **ScheduleSection**: Horarios y contacto
  - Horario de atención estructurado
  - Cards de contacto rápido
  - Imagen destacada con CTAs
  - Diseño responsive

- **ContactForm**: Formulario de contacto
  - Validación de campos requeridos
  - Estados de carga y éxito
  - Campos: nombre, email, teléfono, asunto, mensaje
  - Panel lateral con información de contacto
  - Integración de Google Maps

## Tecnologías Utilizadas

- **Next.js 14**: Framework principal (App Router)
- **React 18**: Librería UI
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos y diseño responsive
- **Lucide React**: Iconos
- **Google Maps API**: Mapas embebidos

## Características Técnicas

### Responsive Design
- Mobile-first approach
- Breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

### Animaciones
- Transiciones suaves entre slides
- Fade-in animations con delays
- Hover effects en tarjetas y botones
- Loading states en formularios

### SEO y Accesibilidad
- Estructura semántica HTML5
- Alt texts en imágenes
- ARIA labels en botones interactivos
- Meta tags apropiados

## Rutas del Portal Público

```
/public-home      → Página de inicio
/about            → Acerca de nosotros
/jobs             → Portal de empleos
/contact          → Contáctenos
/privacy          → Política de privacidad (pendiente)
/terms            → Términos y condiciones (pendiente)
```

## Separación con Sistema Administrativo

El portal público está completamente separado del sistema administrativo:

### Navegación Separada
- **Portal Público**: `PublicNavbar` y `PublicFooter`
- **Sistema Admin**: Navbar y sidebar existentes

### Acceso
- Portal público: Accesible sin autenticación
- Sistema admin: Requiere login (`/dashboard`, `/admin`, etc.)

### Botón de Acceso Rápido
El navbar público incluye un botón "Consola de Administración" que redirige a `/dashboard`

## Personalización

### Colores
Los colores principales están definidos en Tailwind:
- **Primario**: `blue-600`, `blue-700`, `blue-800`
- **Secundario**: `gray-50`, `gray-100`, etc.
- **Acentos**: Gradientes de azul

### Imágenes
Las imágenes actuales son placeholders de Unsplash:
- Se recomienda reemplazarlas con imágenes reales de la empresa
- Rutas sugeridas: `/public/images/`

### Contenido
El contenido actual es genérico:
- Actualizar textos con información real de la empresa
- Modificar valores, misión, visión según corresponda
- Actualizar información de contacto real

## Próximos Pasos Sugeridos

### 1. Integración con Backend
- [ ] Conectar formulario de contacto con API/email service
- [ ] Integrar portal de empleos con base de datos real
- [ ] Sistema de aplicación a empleos con carga de CV

### 2. Páginas Adicionales
- [ ] Página de política de privacidad
- [ ] Página de términos y condiciones
- [ ] Blog/noticias corporativas
- [ ] Testimonios de clientes

### 3. Funcionalidades Avanzadas
- [ ] Sistema de búsqueda avanzada de empleos
- [ ] Filtros adicionales (salario, experiencia, etc.)
- [ ] Sistema de notificaciones de nuevas ofertas
- [ ] Dashboard de candidatos registrados

### 4. Optimizaciones
- [ ] Lazy loading de imágenes
- [ ] Optimización de rendimiento (Core Web Vitals)
- [ ] Implementar reCAPTCHA en formularios
- [ ] Analytics y tracking (Google Analytics, etc.)

### 5. SEO
- [ ] Implementar meta tags dinámicos
- [ ] Crear sitemap.xml
- [ ] Implementar schema.org markup
- [ ] Open Graph tags para redes sociales

## Mantenimiento

### Actualizar Empleos
Los empleos están actualmente en mock data en `/jobs/page.tsx`.
Para agregar empleos reales:
1. Crear API endpoint para empleos
2. Conectar con base de datos
3. Actualizar el componente para consumir la API

### Actualizar Contenido
El contenido estático se encuentra en cada archivo de página:
- Editar directamente los archivos `.tsx`
- Considerar implementar un CMS para gestión de contenido

## Soporte

Para preguntas o problemas con el portal público, revisar:
1. Esta documentación
2. Documentación de Next.js
3. Documentación de Tailwind CSS

## Licencia

Propiedad de PSPG Requisitions © 2025
