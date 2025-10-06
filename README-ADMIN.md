# Endpoint admin server-side

Este endpoint protege operaciones administrativas sensibles usando la Service Role Key de Supabase y un `ADMIN_SECRET` propio.

Variables de entorno necesarias (en Vercel):

- `SUPABASE_SERVICE_ROLE_KEY` (NO exponer en cliente)
- `NEXT_PUBLIC_SUPABASE_URL`
- `ADMIN_SECRET` (cadena secreta que enviarás en header `x-admin-secret`)

Rutas:

- `POST /api/admin` con body JSON. Ejemplos de acciones:

1) Crear profile mínimo para un userId:

```
{ "action": "create-profile", "userId": "<uuid>" }
```

2) Asignar role a un usuario (roleName debe existir en `roles`):

```
{ "action": "assign-role", "userId": "<uuid>", "roleName": "editor" }
```

Ejemplo con curl / PowerShell:

```powershell
curl -X POST "https://tu-app.vercel.app/api/admin" -H "Content-Type: application/json" -H "x-admin-secret: $env:ADMIN_SECRET" -d '{ "action": "create-profile", "userId": "..." }'
```

Usa este endpoint sólo desde tus herramientas administrativas (no desde el navegador del usuario final).
