-- Add idiomas column to requisitions table
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS idiomas JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN requisitions.idiomas IS 'Almacena los idiomas requeridos para el puesto (espanol, ingles, frances, etc.)';
