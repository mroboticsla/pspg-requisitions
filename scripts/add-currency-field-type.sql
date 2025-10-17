-- =====================================================
-- Migración: Agregar tipo de campo 'currency' a form_fields
-- Fecha: 17 de octubre de 2025
-- =====================================================

-- Primero, eliminamos la restricción existente
ALTER TABLE form_fields 
DROP CONSTRAINT IF EXISTS form_fields_field_type_check;

-- Ahora creamos la nueva restricción que incluye 'currency'
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
    'multi-select',
    'currency'
));

-- Verificación: Mostrar los tipos de campo permitidos
COMMENT ON CONSTRAINT form_fields_field_type_check ON form_fields IS 
'Tipos de campo permitidos: text, textarea, number, date, email, phone, checkbox, radio, select, multi-select, currency';

-- Verificar que la restricción se aplicó correctamente
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'form_fields_field_type_check';
