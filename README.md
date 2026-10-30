# NEXORYX — Frontend

**Beyond Connection.**

## 1. Descripción del proyecto

NEXORYX es una aplicación web de colaboración y estudio en tiempo real. Su propósito es permitir que los usuarios creen espacios privados de estudio, interactúen mediante chat y compartan audio, video y pantalla.

Este repositorio contiene el cliente web de NEXORYX, desarrollado con React y TypeScript. Es responsable de la interfaz de usuario y de la comunicación con los servicios backend.

## 2. Tecnologías

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Firebase Authentication
- Axios
- Socket.IO Client
- Simple Peer (WebRTC)
- Lucide React

## 3. Estructura

```text
frontend/
├── public/avatars/            # Avatares predefinidos (avatar-01..08.svg)
├── src/
│   ├── main.tsx               # Punto de entrada, fuentes y proveedores
│   ├── App.tsx                # Rutas
│   ├── index.css              # Tokens de Tailwind (@theme) y estilos globales
│   ├── a11y/                  # SkipLink, useRouteFocus, LiveAnnouncer
│   ├── auth/                  # AuthContext, PrivateRoute, acciones, validación y formularios
│   ├── components/            # Layout (armazón de la app), BrandMark, SystemStatusPill
│   │   └── ui/                # Button, FormField, PasswordField, Modal, SoonButton…
│   ├── hooks/                 # usePageTitle
│   ├── lib/                   # Clientes de Firebase y Axios
│   ├── pages/                 # AuthPage, CompleteProfilePage, DashboardPage, NotFoundPage
│   └── services/              # Llamadas a backend-api (userService, systemService)
├── docs/accesibilidad-wcag.md
├── vercel.json                # Fallback SPA: toda ruta sirve index.html
└── .env.example
```

## Rutas

| Ruta | Página | Acceso |
| --- | --- | --- |
| `/` | `AuthPage`: inicio de sesión, recuperar contraseña (misma vista) y registro en modal | Pública. Con sesión redirige a `/dashboard` o `/completar-perfil`. |
| `/login` | Redirige a `/` | Pública (compatibilidad). |
| `/completar-perfil` | `CompleteProfilePage`: elegir username tras entrar con Google | Sesión sin perfil. |
| `/dashboard` | `DashboardPage` dentro de `Layout` | Sesión con perfil completo. |
| `*` | `NotFoundPage` (404) | Pública. |

`PrivateRoute` usa los estados de `AuthContext`: `loading`, `unconfigured`, `signed-out`, `needs-profile`, `ready` y `error`.

## Conexión con los backends

| Qué | Servicio | Cómo |
| --- | --- | --- |
| Perfil, salas (CRUD), participantes, historial del chat | `backend-api` (`VITE_API_URL`) | REST con `Authorization: Bearer <ID token>` (interceptor de Axios en `src/lib`). |
| Unirse a una sala, presencia, enviar y recibir mensajes | `backend-realtime` (`VITE_REALTIME_URL`) | Socket.IO con `auth: { token: <ID token> }`. |

Según el ADR-001 (README de `backend-realtime`), el historial se pide por REST (`GET /rooms/{roomId}/messages`). Los mensajes nuevos llegan por `message:new`. El catálogo de eventos, payloads y errores también está en ese README.

**Estado:** los backends de salas y chat están listos (TS-02). La interfaz para crear, listar y entrar a salas llega en US-06 y US-08. Hasta entonces esos botones son `SoonButton`: se ven atenuados, siguen siendo enfocables y anuncian en qué historia llegan.

## Variables de entorno

Copia `.env.example` a `.env`. Las `VITE_*` se empaquetan en el navegador, así que solo deben llevar valores públicos.

| Variable | Local | Producción (Vercel) |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000/api/v1` | `https://<api>.onrender.com/api/v1` |
| `VITE_REALTIME_URL` | `http://localhost:3001` | `https://<realtime>.onrender.com` |
| `VITE_FIREBASE_*` | Firebase Console → Configuración del proyecto → Tus apps | Igual |

El dominio de Vercel debe estar en `FRONTEND_URL` de los dos backends (CORS HTTP y WebSocket).

## 4. Responsabilidades del frontend

- Presentar la interfaz de NEXORYX.
- Gestionar la navegación entre páginas.
- Integrar la autenticación mediante Firebase Authentication.
- Consumir los endpoints REST del Backend API.
- Establecer conexiones con Backend Realtime mediante Socket.IO.
- Gestionar la comunicación de audio, video y pantalla mediante WebRTC.
- Mantener una interfaz accesible y adaptable a diferentes dispositivos.

**Importante:** el frontend no accede directamente a Cloud Firestore. Los datos de la aplicación se consultan y modifican mediante los servicios backend.

## 5. Instalación y ejecución

Requisitos: Node.js y npm instalados.

Instalar dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Construir para producción:

```bash
npm run build
```

Revisar accesibilidad y reglas de hooks (ESLint + eslint-plugin-jsx-a11y):

```bash
npm run lint
```

Previsualizar la compilación:

```bash
npm run preview
```

## 6. Accesibilidad (WCAG 2.2 AA)

La estrategia completa está en [docs/accesibilidad-wcag.md](docs/accesibilidad-wcag.md). La base que ya trae cada página:

- `<html lang="es">` y un título distinto por ruta.
- Regiones `header`, `nav`, `main` y `footer`.
- El enlace «Saltar al contenido» es lo primero que se enfoca con Tab.
- Foco visible global (`:focus-visible` en `src/index.css`).
- Al navegar, el foco pasa a `main` y se anuncia el título de la nueva página.

### Componentes base reutilizables

| Componente / hook | Archivo | Uso |
| --- | --- | --- |
| `usePageTitle(title)` | `src/hooks/usePageTitle.ts` | Llamarlo al inicio de cada página: `usePageTitle("Mis salas")` produce «Mis salas \| NEXORYX». |
| `Layout` | `src/components/Layout.tsx` | Armazón de la app con sesión. Tiene una barra de salas, la barra lateral «Tus salas» con la fila del usuario, el encabezado, `main` y el panel de perfil. Las rutas se renderizan dentro con `<Outlet />`. |
| `LiveAnnouncerProvider` / `useAnnounce()` | `src/a11y/LiveAnnouncer.tsx` | Anunciar mensajes al lector de pantalla sin mover el foco: `announce("Mensaje enviado")` (polite) o `announce("Se perdió la conexión", "assertive")`. |
| `FormField` | `src/components/ui/FormField.tsx` | Campo con `label`, ayuda, error, ícono (`icon`) y control a la derecha (`trailing`) enlazados: `<FormField label="Username" hint="3 a 20 caracteres" error={errors.username} required />`. Acepta las props de `<input>`. |
| `Modal` | `src/components/ui/Modal.tsx` | Diálogo con trampa de foco, cierre con Esc y retorno del foco: `<Modal open={open} title="Eliminar sala" onClose={() => setOpen(false)}>…</Modal>`. |
| `Button` | `src/components/ui/Button.tsx` | Botón primario o secundario con estado de carga: `<Button type="submit" loading={pending} loadingLabel="Guardando…">Guardar</Button>`. |
| `PasswordField` | `src/components/ui/PasswordField.tsx` | `FormField` de contraseña con botón «Mostrar/Ocultar» (`aria-pressed`); permite pegar y gestores de contraseñas. |
| `SoonButton` | `src/components/ui/SoonButton.tsx` | Control de una función aún no construida. Lleva `aria-disabled` pero sigue enfocable, y al pulsarlo anuncia «Disponible próximamente (US-xx)»: `<SoonButton label="Crear sala" story="US-06">…</SoonButton>`. |
| `SkipLink` / `useRouteFocus` | `src/a11y/` | Usados por `Layout` y `AuthLayout`: enlace «Saltar al contenido» y foco en `main` al cambiar de ruta. |

Antes de abrir un PR con UI, revisa el checklist de la sección 2 del documento de estrategia.

## 7. Estado del proyecto

**Sprint 0 — Inicialización:** React, TypeScript, Vite, Tailwind y la estructura base.

- [x] TS-04: base de accesibilidad (Lighthouse 100).
- [x] US-01, US-02 y US-03: inicio de sesión, registro, Google con perfil obligatorio, recuperar contraseña y cerrar sesión.
- [x] Página 404.
- [x] Armazón del inicio (`Layout` y `DashboardPage`), con datos reales del perfil y estados vacíos.
- [ ] US-06 y US-08: crear y unirse a salas. El backend ya existe (TS-02).
- [ ] Chat en la sala (Socket.IO y el historial por REST).

## 8. Repositorio

Este proyecto corresponde al repositorio independiente `nexoryx-frontend`.
