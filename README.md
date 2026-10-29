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

## 3. Estructura inicial

```text
frontend/
├── src/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

### Directorios y archivos principales

| Archivo          | Responsabilidad                                   |
| ---------------- | ------------------------------------------------- |
| `src/main.tsx`   | Punto de entrada de React.                        |
| `src/App.tsx`    | Componente raíz de la aplicación.                 |
| `src/index.css`  | Estilos globales y configuración de Tailwind CSS. |
| `index.html`     | Documento HTML principal.                         |
| `vite.config.ts` | Configuración de Vite y sus plugins.              |
| `tsconfig.json`  | Configuración general de TypeScript.              |
| `package.json`   | Dependencias y comandos del proyecto.             |
| `.env.example`   | Plantilla de variables de entorno.                |

La estructura se ampliará progresivamente con componentes, páginas, servicios, hooks, contextos y módulos de la aplicación.

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
| `Layout` | `src/components/Layout.tsx` | Estructura común (skip link, encabezado con navegación, `main`, pie). Las rutas se renderizan dentro con `<Outlet />`. |
| `LiveAnnouncerProvider` / `useAnnounce()` | `src/a11y/LiveAnnouncer.tsx` | Anunciar mensajes al lector de pantalla sin mover el foco: `announce("Mensaje enviado")` (polite) o `announce("Se perdió la conexión", "assertive")`. |
| `FormField` | `src/components/ui/FormField.tsx` | Campo con `label`, ayuda y error enlazados: `<FormField label="Username" hint="3 a 20 caracteres" error={errors.username} required />`. Acepta las props de `<input>`. |
| `Modal` | `src/components/ui/Modal.tsx` | Diálogo con trampa de foco, cierre con Esc y retorno del foco: `<Modal open={open} title="Eliminar sala" onClose={() => setOpen(false)}>…</Modal>`. |

Antes de abrir un PR con UI, revisa el checklist de la sección 2 del documento de estrategia.

## 7. Estado del proyecto

**Sprint 0 — Inicialización**

- [x] Inicialización del proyecto React con TypeScript.
- [x] Configuración inicial de Vite.
- [x] Integración de Tailwind CSS.
- [x] Instalación de las dependencias principales.
- [x] Primera estructura de archivos.
- [x] Validación de compilación de producción.

La implementación de las funcionalidades de autenticación, salas, chat y videollamadas se realizará en los siguientes sprints.

## 8. Repositorio

Este proyecto corresponde al repositorio independiente `nexoryx-frontend`.
