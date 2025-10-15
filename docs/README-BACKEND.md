# Backend del aplicativo

Guía de endpoints API, seguridad y servicios auxiliares del lado servidor.

## Índice

- [Stack](#stack)
- [Variables de entorno](#variables-de-entorno)
- [Endpoints](#endpoints)
	- [POST /api/register](#post-apiregister)
	- [POST /api/admin](#post-apiadmin)
	- [POST /api/admin/secure](#post-apiadminsecure)
- [Librerías y utilidades relacionadas](#librerías-y-utilidades-relacionadas)
- [Seguridad y RLS](#seguridad-y-rls)
- [Pruebas rápidas](#pruebas-rápidas)
- [Notas](#notas)

## Stack

- Next.js (Route Handlers en `app/api/*`)
- Supabase JS con Service Role Key para operaciones privilegiadas
- Validación por roles basada en `profiles` ↔ `roles`

## Variables de entorno

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor)
- `ADMIN_SECRET` (para `/api/admin`)

Asegúrate de configurarlas en tu plataforma (por ejemplo, Vercel). Nunca expongas la Service Role Key al cliente.

## Endpoints

### POST /api/register

Crea el registro mínimo en `public.profiles` después del registro en Auth:
- Si la tabla `profiles` está vacía, asigna rol `superadmin` al primer usuario.
- Para el resto, rol por defecto `candidate`.
- Permite recibir `first_name`, `last_name`, `phone`.

Flujo:
1. Cuenta perfiles: si `count === 0` → `superadmin`.
2. Busca `roles.id` por nombre.
3. Inserta perfil con `role_id` (si existe).

Errores comunes:
- Faltan variables de entorno.
- Rol no encontrado (se insertará sin `role_id`).

Código: `app/api/register/route.ts`.

---

### POST /api/admin

Operaciones administrativas protegidas con header `x-admin-secret` que debe coincidir con `ADMIN_SECRET`.

Acciones soportadas:
- `create-profile` → `{ userId }`
- `assign-role` → `{ userId, roleName }` (role debe existir)

Seguridad:
- Usa `SUPABASE_SERVICE_ROLE_KEY` (solo servidor).
- No consumir desde el navegador de usuarios finales.

Código: `app/api/admin/route.ts`.

---

### POST /api/admin/secure

Operaciones administrativas con autorización basada en token Bearer del usuario y su rol actual.

Flujo:
1. Lee token `Authorization: Bearer <access_token>`.
2. Obtiene usuario con `adminClient.auth.getUser(token)`.
3. Carga `profiles` + `roles` del usuario.
4. Autoriza: solo `admin` y `superadmin` acceden; algunas acciones solo `superadmin`.

Acciones soportadas:
- `list-users` → lista perfiles con su rol
- `list-roles` → lista roles
- `create-role` → solo `superadmin`
- `assign-role` → restricción: `admin` no puede asignar `admin/superadmin`
- `create-profile`
- `delete-profile` → solo `superadmin`

Código: `app/api/admin/secure/route.ts`.

## Librerías y utilidades relacionadas

- `lib/supabaseClient.ts`: cliente Supabase con anon key para cliente (auth PKCE, headers globales).
- `lib/getFullUserData.ts`: compone `auth.getUser()` + `profiles` + `roles`, con manejo de sesión expirada y reintentos.
- `lib/getCurrentUserRole.ts`: obtiene rol desde perfil o RPC `public.current_user_role()`.
- `lib/sessionTracking.ts`: captura geodatos en login y actualiza `metadata` con historial/última acción.

## Seguridad y RLS

- Las políticas de RLS están definidas en `README-SUPABASE.md` y scripts SQL.
- Validar acciones críticas en backend además del filtrado visual en frontend.
- Para endpoints `admin` evitar exponer credenciales; usar secretos de despliegue.

## Pruebas rápidas

- Probar `/api/register` creando perfil tras registro.
- Probar `/api/admin` con `x-admin-secret` correcto e incorrecto.
- Probar `/api/admin/secure` con token de usuario con rol `admin` y `candidate`.

## Notas

- Mantén las acciones idempotentes donde sea posible.
- Registra logs útiles pero evita filtrar secretos en consola.
- Considera límites de tasa si expones acciones costosas.
