# Configuración de Avatares de Usuario

Este documento explica cómo configurar y usar el sistema de avatares de usuario en la aplicación.

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Características Técnicas](#características-técnicas)
4. [Uso en la Aplicación](#uso-en-la-aplicación)
5. [Componentes Disponibles](#componentes-disponibles)
6. [Troubleshooting](#troubleshooting)

## 🚀 Configuración Inicial

### Paso 1: Crear el Bucket de Storage

1. Ve a tu proyecto de Supabase en https://supabase.com
2. Navega a **Storage** en el menú lateral
3. Haz clic en **New bucket**
4. Configura el bucket:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Activado (las imágenes deben ser públicamente accesibles)
5. Haz clic en **Create bucket**

### Paso 2: Ejecutar el Script SQL

Ejecuta el script `scripts/setup-avatars.sql` en el SQL Editor de Supabase:

```bash
# El script configura:
# - Campo avatar_url en la tabla user_metadata
# - Políticas RLS para el bucket avatars
# - Índices para optimización
# - Funciones auxiliares
```

1. Ve a **SQL Editor** en Supabase
2. Copia el contenido de `scripts/setup-avatars.sql`
3. Pega y ejecuta el script
4. Verifica que no haya errores

### Paso 3: Verificar la Configuración

Ejecuta estas queries en el SQL Editor para verificar:

```sql
-- Verificar columna avatar_url
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_metadata' 
AND column_name = 'avatar_url';

-- Verificar políticas
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatar%';
```

```

## 📁 Estructura de Carpetas

Los avatares se organizan de la siguiente manera:

```
avatars/
  └── user-{userId}/
      └── avatar.webp
```

### Ejemplo:
```
avatars/user-123e4567-e89b-12d3-a456-426614174000/avatar.webp
```

**Ventajas de esta estructura:**
- ✅ Fácil de administrar
- ✅ Un avatar por usuario (siempre el mismo nombre de archivo)
- ✅ Las actualizaciones sobrescriben el archivo anterior automáticamente
- ✅ Fácil de buscar avatares por ID de usuario
- ✅ Políticas de seguridad simples y efectivas

## ⚙️ Características Técnicas

### Procesamiento de Imágenes

- **Formato de salida**: WebP (mejor compresión que JPG/PNG)
- **Tamaño final**: 512 x 512 píxeles
- **Relación de aspecto**: 1:1 (cuadrado, obligatorio)
- **Calidad**: 85% (balance entre tamaño y calidad)
- **Tamaño máximo de archivo**: ~500KB después de compresión
- **Formatos aceptados**: JPG, PNG, WebP, GIF

### Recorte Inteligente

Si el usuario selecciona una imagen que no es cuadrada:
1. Se muestra un modal de recorte interactivo
2. El usuario puede ajustar el área de recorte
3. El área se restringe a relación de aspecto 1:1
4. La imagen se procesa y redimensiona al confirmar

Si la imagen ya es cuadrada:
1. Se procesa directamente sin mostrar el modal
2. Se redimensiona a 512x512px
3. Se convierte a WebP automáticamente

### Validaciones

- ✅ Tipo de archivo válido (imágenes solamente)
- ✅ Tamaño máximo antes de subir: 5MB
- ✅ Relación de aspecto 1:1 (se forza mediante recorte)
- ✅ Redimensionamiento automático a 512x512px

## 💻 Uso en la Aplicación

### Para Usuarios

1. Ve a **Mi Perfil**
2. En la sección de "Foto de Perfil", haz clic en **Subir Foto** o **Cambiar Foto**
3. Selecciona una imagen de tu computadora
4. Si la imagen no es cuadrada, ajusta el área de recorte
5. Haz clic en **Aplicar Recorte** (si aplica)
6. La imagen se procesará y subirá automáticamente
7. Tu avatar aparecerá en el header, menú de usuario y perfil

### Eliminar Avatar

1. Ve a **Mi Perfil**
2. Haz clic en el botón **Eliminar**
3. Confirma la acción
4. Tu avatar se reemplazará por tus iniciales

## 🧩 Componentes Disponibles

### `AvatarUpload`

Componente completo para subir, recortar y administrar avatares.

```tsx
import AvatarUpload from '@/app/components/AvatarUpload';

<AvatarUpload 
  user={user}
  currentAvatarUrl={avatarUrl}
  onAvatarUpdate={(newUrl) => setAvatarUrl(newUrl)}
/>
```

**Props:**
- `user`: Objeto con `id` y `email` del usuario
- `currentAvatarUrl`: URL actual del avatar (opcional)
- `onAvatarUpdate`: Callback cuando se actualiza el avatar (opcional)

### `UserAvatar`

Componente para mostrar el avatar del usuario en cualquier parte de la app.

```tsx
import UserAvatar from '@/app/components/UserAvatar';

<UserAvatar 
  avatarUrl={user.avatarUrl}
  initials="JD"
  size="md"
/>
```

**Props:**
- `avatarUrl`: URL del avatar (opcional, si no hay muestra iniciales)
- `initials`: Iniciales a mostrar si no hay avatar
- `size`: Tamaño (`'sm'` | `'md'` | `'lg'` | `'xl'`)
- `className`: Clases CSS adicionales (opcional)

### `ImageCropModal`

Modal para recortar imágenes (usado internamente por AvatarUpload).

```tsx
import ImageCropModal from '@/app/components/ImageCropModal';

<ImageCropModal
  imageFile={file}
  onCropComplete={(blob) => handleCrop(blob)}
  onCancel={() => setShowModal(false)}
/>
```

## 🛠️ Utilidades

### `imageUtils.ts`

Funciones para procesar imágenes:

```tsx
import { 
  validateImageFile,
  isSquareImage,
  resizeAndConvertToWebP,
  canvasToWebP,
  createCroppedCanvas,
  getImageDimensions
} from '@/lib/imageUtils';

// Validar archivo
const validation = validateImageFile(file);
if (!validation.valid) {
  console.error(validation.error);
}

// Verificar si es cuadrada
const isSquare = await isSquareImage(file);

// Redimensionar y convertir
const webpBlob = await resizeAndConvertToWebP(file, 512);
```

## 🔍 Troubleshooting

### Error: "new row violates row-level security policy"

**Causa**: Las políticas RLS no están configuradas correctamente.

**Solución**:
1. Verifica que el script SQL se ejecutó correctamente
2. Confirma que las políticas existen: `SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%avatar%';`
3. Verifica que el usuario está autenticado
4. Confirma que la ruta del archivo sigue el patrón `user-{userId}/avatar.webp`

### Error: "Bucket not found"

**Causa**: El bucket 'avatars' no existe o no está correctamente nombrado.

**Solución**:
1. Ve a Storage en Supabase
2. Verifica que existe un bucket llamado exactamente `avatars`
3. Verifica que está marcado como público

### Las imágenes no se muestran

**Causa**: Problema con la URL pública o el bucket no es público.

**Solución**:
1. Verifica que el bucket `avatars` está marcado como "Public bucket"
2. Inspecciona la URL en las DevTools del navegador
3. Intenta acceder a la URL directamente en otra pestaña
4. La URL debe tener este formato: `https://{project-ref}.supabase.co/storage/v1/object/public/avatars/user-{userId}/avatar.webp`

### El modal de recorte no aparece

**Causa**: Error en la librería `react-image-crop` o estilos CSS faltantes.

**Solución**:
1. Verifica que el CSS de react-image-crop se importa: `import 'react-image-crop/dist/ReactCrop.css';`
2. Revisa la consola del navegador en busca de errores
3. Verifica que la librería está instalada: `npm list react-image-crop`

### La imagen es muy grande después de subir

**Causa**: El proceso de compresión falló o los parámetros no son correctos.

**Solución**:
1. Verifica la configuración en `resizeAndConvertToWebP` en `imageUtils.ts`
2. Asegúrate de que `browser-image-compression` está instalado correctamente
3. Los parámetros recomendados:
   - `maxSizeMB: 0.5`
   - `maxWidthOrHeight: 512`
   - `fileType: 'image/webp'`
   - `initialQuality: 0.85`

### Error: "Failed to convert canvas to blob"

**Causa**: Problema con el navegador o la imagen corrupta.

**Solución**:
1. Prueba con otra imagen
2. Asegúrate de que el navegador soporta WebP
3. Verifica que tienes permisos de CORS si la imagen viene de otro dominio

## 📊 Monitoreo

### Ver avatares subidos

```sql
-- Ver todos los avatares en el bucket
SELECT * FROM storage.objects 
WHERE bucket_id = 'avatars' 
ORDER BY created_at DESC;

-- Ver usuarios con avatar
SELECT 
  um.user_id,
  um.avatar_url,
  p.first_name,
  p.last_name
FROM user_metadata um
JOIN profiles p ON p.id = um.user_id
WHERE um.avatar_url IS NOT NULL;
```

### Estadísticas

```sql
-- Contar usuarios con avatar
SELECT COUNT(*) as users_with_avatar
FROM user_metadata
WHERE avatar_url IS NOT NULL;

-- Tamaño total usado por avatares
SELECT 
  COUNT(*) as total_files,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
WHERE bucket_id = 'avatars';
```

## 🔒 Seguridad

- ✅ Solo usuarios autenticados pueden subir avatares
- ✅ Cada usuario solo puede modificar su propio avatar
- ✅ Las rutas se validan automáticamente por las políticas RLS
- ✅ Los avatares son públicos pero las URLs son predecibles solo si conoces el UUID del usuario
- ✅ Validación de tipo y tamaño de archivo en el cliente
- ✅ Procesamiento y sanitización de imágenes antes de subir

## 📝 Notas Adicionales

- Los avatares se sobrescriben automáticamente al subir uno nuevo (no se acumulan)
- El formato WebP reduce el tamaño hasta un 30% comparado con JPG
- El procesamiento se hace en el cliente para no sobrecargar el servidor
- Los avatares se cargan de forma lazy en los componentes
- La librería `browser-image-compression` usa Web Workers para no bloquear la UI
