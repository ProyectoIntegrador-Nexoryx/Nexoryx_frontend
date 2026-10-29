# Estrategia de accesibilidad WCAG 2.2 AA — NEXORYX

**Objetivo:** que una persona ciega pueda usar NEXORYX de punta a punta con lector de pantalla y teclado: registrarse, iniciar sesión, crear o unirse a una sala, chatear y controlar audio y video.

**Nivel:** WCAG 2.2, conformidad AA.

**Lectores de pantalla de referencia:** NVDA + Firefox/Chrome (Windows) y VoiceOver + Safari (macOS).

## 1. Criterios clave y cómo los cubrimos

| Criterio WCAG 2.2 | Qué exige | Cómo lo cumple el frontend |
| --- | --- | --- |
| 1.1.1 Contenido no textual | Texto alternativo | Íconos decorativos con `aria-hidden="true"`; botones solo con ícono llevan `aria-label` (p. ej. «Silenciar micrófono»). Regla `jsx-a11y/alt-text`. |
| 1.3.1 Información y relaciones | Estructura semántica | Regiones `header`, `nav`, `main`, `footer`; un `h1` por página; `FormField` asocia `label`, ayuda y error. |
| 1.4.3 Contraste mínimo | 4.5:1 en texto normal | Paleta oscura: texto `slate-50`/`slate-300` sobre `slate-900` (> 7:1); botones `sky-500` con texto `slate-950` (> 7:1). |
| 1.4.11 Contraste no textual | 3:1 en controles y foco | Bordes de campos `slate-500`; anillo de foco `sky-300` (> 10:1). |
| 2.1.1 Teclado | Todo operable con teclado | Solo elementos nativos (`button`, `a`, `input`, `dialog`); reglas `jsx-a11y/click-events-have-key-events` y `no-static-element-interactions`. |
| 2.1.2 Sin trampas de teclado | Siempre se puede salir | `Modal` (con `<dialog>`) se cierra con Esc y con el botón «Cerrar». |
| 2.4.1 Evitar bloques | Saltar contenido repetido | Enlace «Saltar al contenido»: primer elemento enfocable de cada página. |
| 2.4.2 Título de página | Título distinto por vista | Hook `usePageTitle` («Página \| NEXORYX»). |
| 2.4.3 Orden del foco | Orden lógico | Orden del DOM = orden visual; al cambiar de ruta el foco va a `main`; al cerrar un modal vuelve al botón que lo abrió. |
| 2.4.7 / 2.4.13 Foco visible / apariencia del foco | Foco siempre visible | Regla global `:focus-visible` con contorno de 3 px. |
| 2.4.11 Foco no oculto | Foco no tapado | `scroll-padding-top` para encabezados fijos futuros. |
| 2.5.8 Tamaño del objetivo | Mínimo 24×24 px | Botones y enlaces con `px-3 py-2` como mínimo. |
| 3.1.1 Idioma de la página | Declarar idioma | `<html lang="es">`. |
| 3.3.1 / 3.3.3 Identificación y sugerencia de errores | Error en texto, asociado al campo | `FormField` con `aria-invalid` y `aria-describedby`; mensajes que dicen cómo corregir. |
| 3.3.7 Entrada redundante / 3.3.8 Autenticación accesible | Sin pruebas cognitivas | Login con Google y con correo; se permite pegar y usar el gestor de contraseñas (sin bloquear `paste`). |
| 4.1.2 Nombre, función, valor | Controles con nombre y estado | Botones de micrófono y cámara con `aria-pressed`; enlaces activos con `aria-current="page"` (NavLink). |
| 4.1.3 Mensajes de estado | Anunciar sin mover el foco | `LiveAnnouncer` compartido (`aria-live` polite/assertive): nuevos mensajes de chat, «Te uniste a la sala», errores de red. |

## 2. Reglas para cada vista nueva (checklist de PR)

- [ ] La página llama a `usePageTitle("…")` y tiene un único `h1`.
- [ ] Los formularios usan `FormField`; ningún `input` sin `label`.
- [ ] Los diálogos usan `Modal`; nada de `div` con `onClick` como botón.
- [ ] Los cambios dinámicos (chat, carga, errores) se anuncian con `useAnnounce()`.
- [ ] Los botones de solo ícono tienen `aria-label`; los íconos, `aria-hidden="true"`.
- [ ] `npm run lint` pasa sin errores de `jsx-a11y`.

## 3. Cómo se comprueba

| Prueba | Herramienta | Cuándo | Criterio de éxito |
| --- | --- | --- | --- |
| Análisis estático | `npm run lint` (eslint-plugin-jsx-a11y, modo `strict`) | Cada PR | 0 errores |
| Auditoría automática | Lighthouse (pestaña Accesibilidad) en la app publicada | Cada sprint | Puntaje ≥ 90; captura en el PR |
| Solo teclado | Tab, Shift+Tab, Enter, Espacio, Esc | Cada historia con UI | Se completa el flujo; foco siempre visible y en orden lógico |
| Lector de pantalla | VoiceOver (Cmd+F5) o NVDA | Cada historia con UI | Cada control se anuncia con nombre, función y estado; los mensajes de estado se leen sin mover el foco |
| Zoom y reflujo | Zoom del navegador al 200 % y ancho de 320 px | Cada sprint | Sin scroll horizontal ni contenido cortado |

## 4. Retos específicos de NEXORYX

- **Chat en tiempo real:** cada mensaje nuevo se anuncia con `polite` («Ana: hola»), sin robar el foco a quien está escribiendo.
- **Videollamada:** cada participante tiene su nombre como texto, no solo en el video. Los estados de micrófono y cámara se exponen con `aria-pressed` y texto («Micrófono apagado»).
- **Compartir pantalla:** se anuncia al iniciar y al detener («Ana empezó a compartir pantalla»).
