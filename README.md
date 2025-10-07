# PSPG Requisitions

Plataforma interna para la gestión y aprobación de requisiciones de nuevo personal para PSP Group. Esta herramienta digitaliza y agiliza el proceso de solicitud de contratación entre los gerentes de departamento y el equipo de Recursos Humanos.

---

## 📋 Características Principales

* **Flujo de Aprobación:** Proceso claro para que RRHH revise, apruebe o rechace las solicitudes de personal.
* **Constructor de Formularios:** Permite a los administradores crear y personalizar las plantillas de requisición según las necesidades de la empresa.
* **Gestión de Roles:** Tres niveles de usuario con distintos permisos para una seguridad y control adecuados.
* **Dashboard de Seguimiento:** Paneles visuales para que tanto gerentes como RRHH puedan ver el estado de las requisiciones en tiempo real.
* **Historial de Solicitudes:** Archivo centralizado de todas las requisiciones pasadas y presentes.
* **Perfiles de Usuario:** Sistema completo de perfiles con fotos de avatar, recorte inteligente y almacenamiento optimizado.
* **Auditoría de Sesiones:** Seguimiento detallado de sesiones de usuario con geolocalización y metadatos de dispositivo.

---

## 🧑‍💻 Roles de Usuario

1.  **Solicitante (Gerente):** Puede crear nuevas requisiciones, guardarlas como borrador y ver el estado únicamente de sus propias solicitudes.
2.  **Gestor RRHH:** Puede ver *todas* las requisiciones, cambiar su estado (Aprobada/Rechazada) y gestionar el flujo de trabajo.
3.  **Administrador:** Tiene control total sobre la plataforma, incluyendo la gestión de usuarios, la configuración de la empresa y la personalización de los formularios de requisición.

---

## 🛠️ Stack Tecnológico

* **Frontend:** [Next.js](https://nextjs.org/) (con React 18)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
* **Backend/Autenticación:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
* **Procesamiento de Imágenes:** react-image-crop, browser-image-compression
* **Iconos:** [Lucide React](https://lucide.dev/)

---

## 📚 Documentación

- [README-SUPABASE.md](docs/README-SUPABASE.md) - Configuración de Supabase y base de datos
- [README-FRONTEND.md](docs/README-FRONTEND.md) - Arquitectura del frontend
- [README-ADMIN.md](docs/README-ADMIN.md) - Panel de administración
- [README-SESSION-AUDIT.md](docs/README-SESSION-AUDIT.md) - Sistema de auditoría de sesiones
- [README-AVATARS.md](docs/README-AVATARS.md) - **Sistema de avatares de usuario** ⭐ NUEVO
- [TROUBLESHOOTING-SESSION.md](docs/TROUBLESHOOTING-SESSION.md) - Solución de problemas
- [VISUAL-GUIDE-SESSION.md](docs/VISUAL-GUIDE-SESSION.md) - Guía visual de sesiones

---

## 🚀 Cómo Empezar

Sigue estos pasos para tener una copia del proyecto corriendo en tu máquina local.

### Prerrequisitos

* Node.js (v18 o superior)
* npm o yarn
* Una instancia de PostgreSQL corriendo localmente o en la nube.

### Instalación

1.  **Clona el repositorio**
    ```sh
    git clone [https://github.com/tu-usuario/pspg-requisitions.git](https://github.com/tu-usuario/pspg-requisitions.git)
    ```
2.  **Navega al directorio del proyecto**
    ```sh
    cd pspg-requisitions
    ```
3.  **Instala las dependencias**
    ```sh
    npm install
    # o
    yarn install
    ```
4.  **Configura las variables de entorno**
    Crea un archivo `.env.local` en la raíz del proyecto, copiando el contenido de `.env.example`.
    ```sh
    cp .env.example .env.local
    ```
    Luego, edita el archivo `.env.local` con la URL de conexión a tu base de datos.

5.  **Ejecuta las migraciones de la base de datos**
    Esto creará las tablas en tu base de datos según el esquema de Prisma.
    ```sh
    npx prisma migrate dev
    ```
6.  **Inicia el servidor de desarrollo**
    ```sh
    npm run dev
    ```
    Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

---

### Variables de Entorno

Para correr este proyecto, necesitas crear un archivo `.env.local` con la siguiente variable:
