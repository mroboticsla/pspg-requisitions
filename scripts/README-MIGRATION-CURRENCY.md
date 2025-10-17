# Migración: Agregar tipo de campo 'currency'

## Descripción
Esta migración agrega el tipo de campo `'currency'` a la tabla `form_fields` en la base de datos Supabase.

## Problema
Al intentar crear o editar campos con tipo `'currency'`, se recibe el siguiente error:
```
Error: new row for relation "form_fields" violates check constraint "form_fields_field_type_check"
```

## Solución
Ejecutar el script SQL que actualiza la restricción CHECK en la tabla `form_fields`.

## Instrucciones para aplicar la migración

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Accede a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo `add-currency-field-type.sql`
5. Ejecuta la query (botón RUN o Ctrl+Enter)
6. Verifica que se muestre el mensaje de éxito

### Opción 2: Usando Supabase CLI

```bash
# Asegúrate de estar en el directorio del proyecto
cd "d:\M-Robotics\GitHub\PSP Group\pspg-requisitions"

# Ejecuta la migración
supabase db execute --file scripts/add-currency-field-type.sql
```

### Opción 3: Manualmente con psql

```bash
psql -h [HOST] -U postgres -d postgres -f scripts/add-currency-field-type.sql
```

## Verificación

Después de ejecutar la migración, verifica que funcionó correctamente:

```sql
-- Deberías ver la restricción actualizada con 'currency' incluido
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'form_fields_field_type_check';
```

La salida debería mostrar algo como:
```
CHECK ((field_type = ANY (ARRAY['text'::text, 'textarea'::text, 'number'::text, 'date'::text, 'email'::text, 'phone'::text, 'checkbox'::text, 'radio'::text, 'select'::text, 'multi-select'::text, 'currency'::text])))
```

## Prueba

Después de aplicar la migración, intenta:

1. Crear un nuevo campo con tipo `'currency'` en una plantilla
2. Editar un campo existente y cambiar su tipo a `'currency'`
3. Verificar que no aparezcan errores en la consola

## Rollback (Si es necesario)

Si necesitas revertir esta migración:

```sql
ALTER TABLE form_fields 
DROP CONSTRAINT IF EXISTS form_fields_field_type_check;

ALTER TABLE form_fields 
ADD CONSTRAINT form_fields_field_type_check 
CHECK (field_type IN (
    'text',
    'textarea',
    'number',
    'date',
    'email',
    'phone',
    'checkbox',
    'radio',
    'select',
    'multi-select'
));
```

## Notas

- Esta migración es **no destructiva** - no elimina ni modifica datos existentes
- Solo actualiza la restricción de validación para permitir el nuevo tipo
- Es compatible con versiones anteriores del código
- Se recomienda hacer backup antes de ejecutar migraciones en producción

## Archivos relacionados

- **Frontend**: 
  - `lib/types/requisitions.ts` - Definición del tipo TypeScript
  - `app/components/CurrencyInput.tsx` - Componente de entrada de moneda
  - `app/components/DynamicField.tsx` - Renderizado del campo currency
  - `app/admin/templates/[id]/sections/page.tsx` - Selector de tipo de campo

- **Backend**:
  - Este script SQL actualiza la restricción en Supabase/PostgreSQL
