# Supabase: configuración de base de datos y storage

Este documento centraliza la configuración necesaria en Supabase: tablas, RLS, funciones y storage para avatares. Los scripts de apoyo viven en `scripts/`.

## Índice

- [Tablas principales](#tablas-principales)
- [Configuración SQL](#configuración-sql)
- [Políticas RLS](#políticas-rls)
- [Storage: Avatares](#storage-avatares)
- [Funciones RPC utilizadas por el frontend](#funciones-rpc-utilizadas-por-el-frontend)
- [Tips y checks útiles](#tips-y-checks-útiles)
- [Seguridad](#seguridad)

## Tablas principales

- `public.roles` → catálogo de roles con `permissions jsonb` opcional
- `public.profiles` → perfil público ligado a `auth.users` (FK `id`), incluye `role_id`, `metadata jsonb`, `updated_at`

Inicialización recomendada (roles base): `superadmin`, `admin`, `partner`, `candidate`.

Puedes crear estas tablas y datos con tu migración o ejecutando fragmentos en el SQL Editor. Mantén índices según necesidad.

### Configuración SQL

````sql
# Configuración de base de datos con Supabase

## Roles y Usuarios

```
-- 1. Tabla de Roles
-- Almacena los diferentes roles y sus permisos asociados.
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  permissions jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.roles IS 'Almacena los roles de usuario y sus permisos en formato JSON.';
COMMENT ON COLUMN public.roles.permissions IS 'Reglas de acceso (ej: {"modules": {"articles": ["create", "read"]}}).';

-- 2. Tabla de Perfiles
-- Extiende la tabla auth.users para añadir información pública y de la aplicación.
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  role_id uuid REFERENCES public.roles ON DELETE SET NULL,
  metadata jsonb,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Almacena la información del perfil público de un usuario, vinculada a auth.users.';
COMMENT ON COLUMN public.profiles.role_id IS 'FK a la tabla de roles para definir los permisos del usuario.';

-- 3. (OPCIONAL PERO RECOMENDADO) Insertar roles iniciales
-- Es una buena práctica tener roles base al iniciar el proyecto.
INSERT INTO public.roles (name, permissions)
VALUES
  ('superadmin',  '{"description": "Acceso total a nivel de sistema. Puede gestionar admins."}'),
  ('admin',       '{"description": "Acceso administrativo a la plataforma. Gestiona partners y candidatos."}'),
  ('partner',     '{"description": "Acceso para socios. Puede ver candidatos y gestionar sus propias ofertas."}'),
  ('candidate',   '{"description": "Acceso para candidatos. Puede ver ofertas y gestionar su perfil."}');
```

## Políticas RLS

Habilitar RLS y crear funciones/políticas:

1) Habilitar RLS en tablas
- `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
- `ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;`

2) Función auxiliar para conocer el rol
- `public.get_user_role(user_id uuid) RETURNS text SECURITY DEFINER` → lee `profiles`↔`roles`
- `public.current_user_role()` → wrapper sobre `auth.uid()` que retorna el nombre del rol

3) Políticas sugeridas
- profiles SELECT: admins ven todos; otros solo su propio registro
- profiles UPDATE: el usuario actualiza su propio registro; admins pueden actualizar cualquiera
- profiles DELETE: solo `superadmin`
- roles SELECT: `TO authenticated USING (true)`

Consulta ejemplos completos en este repositorio (historial previo) o reusa tus migraciones. Si necesitas copiar/pegar, crea un script SQL con estas piezas para tu entorno.

## Storage: Avatares

Bucket requerido: `avatars` (público).

Ruta por usuario: `avatars/user-{userId}/avatar.webp`.

Políticas en `storage.objects` sugeridas:
- Lectura pública de `avatars/*`
- Insert/Update/Delete: solo el usuario autenticado sobre su propio prefijo `user-{auth.uid()}/...`

Scripts de apoyo:
- `scripts/setup-avatars.sql` → crea bucket/policies/campo `avatar_url` y políticas necesarias
- `scripts/verify-avatars.sql` → queries de verificación

Troubleshooting rápido:
- Error 400/403 al acceder a imagen pública → verifica que el bucket exista y sea público; vuelve a ejecutar `setup-avatars.sql`
- Políticas faltantes → ver `pg_policies` para `storage.objects`

## Funciones RPC utilizadas por el frontend

- `public.current_user_role()` → usada por `lib/getCurrentUserRole.ts`

Otorga `GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;` y revoca de `PUBLIC`.

## Tips y checks útiles

- Ver roles existentes: `SELECT id, name FROM public.roles;`
- Ver perfil con metadata: `SELECT id, role_id, metadata FROM public.profiles LIMIT 10;`
- Ver políticas: `SELECT * FROM pg_policies WHERE tablename IN ('profiles','roles');`
- Objetos en storage: `SELECT * FROM storage.objects WHERE bucket_id = 'avatars' ORDER BY created_at DESC;`

## Seguridad

- Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` al cliente
- Endpoints server-side validan rol y/o `ADMIN_SECRET`
- RLS debe ser tu última línea de defensa; valida también en backend
````

## Creación de tablas para manejo de empresas

```
-- =====================================================
-- 1. Tabla de Empresas (Companies)
-- =====================================================
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  tax_id text UNIQUE, -- RFC o NIT
  industry text,
  website text,
  logo_url text,
  address jsonb, -- {"street": "", "city": "", "state": "", "zip": "", "country": ""}
  contact_info jsonb, -- {"email": "", "phone": "", "mobile": ""}
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb, -- Información adicional flexible
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.companies IS 'Catálogo de empresas/clientes que pueden crear requisiciones.';
COMMENT ON COLUMN public.companies.tax_id IS 'RFC (México) o NIT/Tax ID único de la empresa.';
COMMENT ON COLUMN public.companies.address IS 'Dirección en formato JSON para flexibilidad.';
COMMENT ON COLUMN public.companies.metadata IS 'Datos adicionales: tamaño empresa, sector específico, etc.';

-- Índices recomendados
CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_companies_is_active ON public.companies(is_active);

-- =====================================================
-- 2. Tabla de Usuarios por Empresa (Company Users)
-- =====================================================
CREATE TABLE public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  role_in_company text DEFAULT 'member', -- 'admin', 'member', 'viewer', etc.
  permissions jsonb, -- Permisos específicos dentro de la empresa
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users, -- Quién lo asignó
  is_active boolean NOT NULL DEFAULT true,
  
  UNIQUE(company_id, user_id)
);

COMMENT ON TABLE public.company_users IS 'Relación muchos-a-muchos: qué usuarios (partners) tienen acceso a qué empresas.';
COMMENT ON COLUMN public.company_users.role_in_company IS 'Rol del usuario dentro de esta empresa: admin (gestiona usuarios), member (crea requisiciones), viewer (solo lectura).';
COMMENT ON COLUMN public.company_users.permissions IS 'Permisos adicionales granulares si es necesario.';

-- Índices recomendados
CREATE INDEX idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX idx_company_users_active ON public.company_users(is_active) WHERE is_active = true;

-- =====================================================
-- 3. Trigger para updated_at en companies
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. Habilitar RLS
-- =====================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. Políticas RLS para companies
-- =====================================================

-- Lectura: admins ven todas; partners solo las asignadas
CREATE POLICY "Admins can view all companies"
ON public.companies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Partners can view their assigned companies"
ON public.companies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = companies.id
    AND cu.user_id = auth.uid()
    AND cu.is_active = true
  )
);

-- Inserción: solo admins
CREATE POLICY "Only admins can create companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- Actualización: solo admins
CREATE POLICY "Only admins can update companies"
ON public.companies FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- Eliminación: solo superadmin
CREATE POLICY "Only superadmins can delete companies"
ON public.companies FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name = 'superadmin'
  )
);

-- =====================================================
-- 6. Políticas RLS para company_users
-- =====================================================

-- Lectura: admins ven todo; partners solo sus asignaciones
CREATE POLICY "Admins can view all company assignments"
ON public.company_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Users can view their own company assignments"
ON public.company_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Inserción y actualización: solo admins
CREATE POLICY "Only admins can assign users to companies"
ON public.company_users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Only admins can update company assignments"
ON public.company_users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- Eliminación: solo admins
CREATE POLICY "Only admins can remove company assignments"
ON public.company_users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- =====================================================
-- 7. Función RPC útil: obtener empresas del usuario actual
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_companies()
RETURNS TABLE (
  company_id uuid,
  company_name text,
  role_in_company text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    cu.role_in_company,
    cu.is_active
  FROM public.company_users cu
  JOIN public.companies c ON cu.company_id = c.id
  WHERE cu.user_id = auth.uid()
  AND cu.is_active = true
  AND c.is_active = true
  ORDER BY c.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_companies() TO authenticated;

COMMENT ON FUNCTION public.get_user_companies IS 'Retorna las empresas asignadas al usuario actual (autenticado).';
```

Script de Inserción de Datos de Ejemplo

```
INSERT INTO public.companies (name, legal_name, tax_id)
VALUES ('Acme Corp', 'Acme Corporation S.A. de C.V.', 'ACM123456ABC');
```

```
INSERT INTO public.company_users (company_id, user_id, role_in_company)
VALUES ('<company_uuid>', '<partner_profile_uuid>', 'admin');
```

## Tabla de Requisiciones

Estructura Propuesta:

requisitions (requisición base con campos fijos)
  ├── requisition_responses (respuestas a campos personalizados - JSONB)
  └── form_template_snapshot (copia de la plantilla usada al crear)

form_templates (plantilla de formulario por empresa)
  ├── form_sections (secciones personalizadas)
  └── form_fields (campos dentro de cada sección)

```
-- =====================================================
-- SISTEMA DE REQUISICIONES CON FORMULARIOS PERSONALIZABLES
-- =====================================================

-- =====================================================
-- 1. Tabla de Plantillas de Formulario (por empresa)
-- =====================================================
CREATE TABLE public.form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  
  -- Configuración de la sección dinámica "FUNCIONES PRINCIPALES"
  num_main_functions integer NOT NULL DEFAULT 5,
  
  created_by uuid REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índice único parcial para una sola plantilla activa por empresa
CREATE UNIQUE INDEX idx_form_templates_company_active 
ON public.form_templates(company_id) 
WHERE is_active = true;

COMMENT ON TABLE public.form_templates IS 'Plantillas de formularios personalizables por empresa.';
COMMENT ON COLUMN public.form_templates.num_main_functions IS 'Número de campos de "Funciones principales del puesto" (dinámico entre 1-10).';

CREATE INDEX idx_form_templates_company ON public.form_templates(company_id);
CREATE INDEX idx_form_templates_active ON public.form_templates(is_active) WHERE is_active = true;

-- =====================================================
-- 2. Tabla de Secciones Personalizadas
-- =====================================================
CREATE TABLE public.form_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.form_templates ON DELETE CASCADE,
  name text NOT NULL, -- Título de la sección
  description text,
  position integer NOT NULL DEFAULT 0, -- Orden de aparición (0 = al final)
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.form_sections IS 'Secciones adicionales personalizadas que los admins pueden agregar al formulario.';
COMMENT ON COLUMN public.form_sections.position IS 'Orden de la sección: 0 = al final, 1+ = después de sección N del formulario base.';

CREATE INDEX idx_form_sections_template ON public.form_sections(template_id);

-- =====================================================
-- 3. Tabla de Campos Personalizados
-- =====================================================
CREATE TABLE public.form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.form_sections ON DELETE CASCADE,
  name text NOT NULL, -- Nombre del campo (usado como key en JSONB)
  label text NOT NULL, -- Etiqueta visible para el usuario
  field_type text NOT NULL CHECK (field_type IN (
    'text', 'textarea', 'number', 'date', 'email', 'phone',
    'checkbox', 'radio', 'select', 'multi-select'
  )),
  options jsonb, -- Para select/radio/checkbox: ["Opción 1", "Opción 2"]
  validation jsonb, -- {"required": true, "min": 0, "max": 100, "pattern": "regex"}
  placeholder text,
  help_text text,
  position integer NOT NULL DEFAULT 0, -- Orden dentro de la sección
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.form_fields IS 'Campos individuales dentro de las secciones personalizadas.';
COMMENT ON COLUMN public.form_fields.options IS 'Opciones para campos tipo select, radio o checkbox: ["Opción A", "Opción B"].';
COMMENT ON COLUMN public.form_fields.validation IS 'Reglas de validación: {"required": true, "min": 5, "max": 100, "pattern": "^[0-9]+$"}.';

CREATE INDEX idx_form_fields_section ON public.form_fields(section_id);

-- =====================================================
-- 4. Tabla de Requisiciones (campos fijos)
-- =====================================================
CREATE TABLE public.requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES auth.users,
  template_id uuid REFERENCES public.form_templates, -- Plantilla usada al crear
  template_snapshot jsonb NOT NULL, -- Snapshot de la plantilla completa (para versionado)
  
  -- Estado y tracking
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'in_review', 'approved', 'rejected', 'cancelled', 'filled'
  )),
  
  -- DATOS GENERALES (campos fijos)
  departamento text,
  puesto_requerido text,
  numero_vacantes integer,
  
  -- INFORMACIÓN SOBRE EL PUESTO (campos fijos)
  tipo_puesto jsonb, -- {"nuevaCreacion": true, "reemplazoTemporal": false, ...}
  motivo_puesto text,
  nombre_empleado_reemplaza text,
  
  -- FUNCIONES PRINCIPALES (dinámico según template)
  funciones_principales text[], -- Array con las funciones [funcion1, funcion2, ...]
  
  -- PERFIL DEL PUESTO (campos fijos)
  formacion_academica jsonb, -- {"bachiller": true, "tecnico": false, ...}
  otros_estudios text,
  idioma_ingles boolean,
  
  -- HABILIDAD INFORMÁTICA (campos fijos)
  habilidad_informatica jsonb, -- Estructura completa de habilidades
  
  -- HABILIDADES Y CONOCIMIENTOS TÉCNICOS (campos fijos)
  habilidades_tecnicas jsonb, -- {"informacion": true, "maquinariaEquipos": false, ...}
  
  -- Metadatos y fechas
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.requisitions IS 'Requisiciones de personal con campos fijos y referencia a plantilla usada.';
COMMENT ON COLUMN public.requisitions.template_snapshot IS 'Snapshot JSON completo de la plantilla (template + sections + fields) al momento de crear la requisición.';
COMMENT ON COLUMN public.requisitions.funciones_principales IS 'Array dinámico de funciones principales según lo configurado en la plantilla.';

CREATE INDEX idx_requisitions_company ON public.requisitions(company_id);
CREATE INDEX idx_requisitions_created_by ON public.requisitions(created_by);
CREATE INDEX idx_requisitions_status ON public.requisitions(status);
CREATE INDEX idx_requisitions_created_at ON public.requisitions(created_at DESC);

-- =====================================================
-- 5. Tabla de Respuestas a Campos Personalizados
-- =====================================================
CREATE TABLE public.requisition_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id uuid NOT NULL REFERENCES public.requisitions ON DELETE CASCADE,
  section_id uuid NOT NULL, -- ID de la sección (del snapshot)
  responses jsonb NOT NULL, -- {"campo1": "valor", "campo2": 123, ...}
  created_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(requisition_id, section_id)
);

COMMENT ON TABLE public.requisition_responses IS 'Respuestas del usuario a los campos personalizados definidos en las secciones adicionales.';
COMMENT ON COLUMN public.requisition_responses.responses IS 'Objeto JSON con las respuestas: {"nombreCampo": "valor", "otroCampo": 42}.';

CREATE INDEX idx_requisition_responses_requisition ON public.requisition_responses(requisition_id);

-- =====================================================
-- 6. Triggers para updated_at
-- =====================================================
CREATE TRIGGER set_form_templates_updated_at
BEFORE UPDATE ON public.form_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_requisitions_updated_at
BEFORE UPDATE ON public.requisitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. Habilitar RLS
-- =====================================================
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_responses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. Políticas RLS - Form Templates
-- =====================================================

-- Lectura: admins ven todas; partners solo las de sus empresas
CREATE POLICY "Admins can view all templates"
ON public.form_templates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Partners can view their company templates"
ON public.form_templates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = form_templates.company_id
    AND cu.user_id = auth.uid()
    AND cu.is_active = true
  )
);

-- Inserción/Actualización/Eliminación: solo admins
CREATE POLICY "Only admins can manage templates"
ON public.form_templates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- =====================================================
-- 9. Políticas RLS - Form Sections y Fields
-- =====================================================

CREATE POLICY "Users can view sections of accessible templates"
ON public.form_sections FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.form_templates ft
    WHERE ft.id = form_sections.template_id
    AND (
      -- Es admin
      EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.id = auth.uid()
        AND r.name IN ('superadmin', 'admin')
      )
      OR
      -- Es partner de la empresa
      EXISTS (
        SELECT 1 FROM public.company_users cu
        WHERE cu.company_id = ft.company_id
        AND cu.user_id = auth.uid()
        AND cu.is_active = true
      )
    )
  )
);

CREATE POLICY "Only admins can manage sections"
ON public.form_sections FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- Mismas políticas para form_fields
CREATE POLICY "Users can view fields of accessible sections"
ON public.form_fields FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.form_sections fs
    JOIN public.form_templates ft ON ft.id = fs.template_id
    WHERE fs.id = form_fields.section_id
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.id = auth.uid()
        AND r.name IN ('superadmin', 'admin')
      )
      OR
      EXISTS (
        SELECT 1 FROM public.company_users cu
        WHERE cu.company_id = ft.company_id
        AND cu.user_id = auth.uid()
        AND cu.is_active = true
      )
    )
  )
);

CREATE POLICY "Only admins can manage fields"
ON public.form_fields FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- =====================================================
-- 10. Políticas RLS - Requisitions
-- =====================================================

-- Lectura: admins ven todas; partners solo las de sus empresas
CREATE POLICY "Admins can view all requisitions"
ON public.requisitions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Partners can view their company requisitions"
ON public.requisitions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = requisitions.company_id
    AND cu.user_id = auth.uid()
    AND cu.is_active = true
  )
);

-- Inserción: partners de la empresa pueden crear
CREATE POLICY "Partners can create requisitions for their companies"
ON public.requisitions FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = requisitions.company_id
    AND cu.user_id = auth.uid()
    AND cu.is_active = true
  )
);

-- Actualización: el creador puede actualizar sus propias requisiciones en draft
CREATE POLICY "Users can update their own draft requisitions"
ON public.requisitions FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  AND status = 'draft'
);

-- Admins pueden actualizar cualquier requisición
CREATE POLICY "Admins can update any requisition"
ON public.requisitions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name IN ('superadmin', 'admin')
  )
);

-- Eliminación: solo el creador puede eliminar borradores
CREATE POLICY "Users can delete their own draft requisitions"
ON public.requisitions FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  AND status = 'draft'
);

-- =====================================================
-- 11. Políticas RLS - Requisition Responses
-- =====================================================

CREATE POLICY "Users can view responses of accessible requisitions"
ON public.requisition_responses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.requisitions r
    WHERE r.id = requisition_responses.requisition_id
    AND (
      r.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles ro ON p.role_id = ro.id
        WHERE p.id = auth.uid()
        AND ro.name IN ('superadmin', 'admin')
      )
      OR EXISTS (
        SELECT 1 FROM public.company_users cu
        WHERE cu.company_id = r.company_id
        AND cu.user_id = auth.uid()
        AND cu.is_active = true
      )
    )
  )
);

CREATE POLICY "Users can manage responses of their own requisitions"
ON public.requisition_responses FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.requisitions r
    WHERE r.id = requisition_responses.requisition_id
    AND r.created_by = auth.uid()
  )
);

-- =====================================================
-- 12. Función RPC: Obtener plantilla activa de empresa
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_company_active_template(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template jsonb;
BEGIN
  SELECT jsonb_build_object(
    'template', row_to_json(ft.*),
    'sections', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'section', row_to_json(fs.*),
          'fields', (
            SELECT jsonb_agg(row_to_json(ff.*) ORDER BY ff.position)
            FROM public.form_fields ff
            WHERE ff.section_id = fs.id
          )
        ) ORDER BY fs.position
      )
      FROM public.form_sections fs
      WHERE fs.template_id = ft.id
    )
  )
  INTO v_template
  FROM public.form_templates ft
  WHERE ft.company_id = p_company_id
  AND ft.is_active = true;
  
  RETURN COALESCE(v_template, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_active_template(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_company_active_template IS 'Retorna la plantilla activa completa de una empresa con sus secciones y campos.';

-- =====================================================
-- 13. Datos de ejemplo: Plantilla base (opcional)
-- =====================================================
-- Crear plantilla base para empresas sin personalización
INSERT INTO public.form_templates (company_id, name, description, num_main_functions, is_active)
SELECT 
  id,
  'Plantilla Base',
  'Formulario estándar de requisiciones',
  5,
  true
FROM public.companies
WHERE NOT EXISTS (
  SELECT 1 FROM public.form_templates WHERE company_id = companies.id
)
LIMIT 1; -- Solo como ejemplo
```
