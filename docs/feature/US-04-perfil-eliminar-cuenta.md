# Rama: `feature/US-04-perfil-eliminar-cuenta`

Historia: **US-04 — Gestión del perfil (ver, editar, guardar) y eliminación de cuenta**.
Fecha: 2026-11-19. Proyecto: NEXORYX (frontend).

## Cambios realizados

### Nuevos archivos
- `src/pages/ProfilePage.tsx` — pantalla `/perfil`: muestra datos reales (avatar, nombre, usuario, correo, miembro desde) y permite editar nombres, usuario y avatar. Al guardar llama a `PATCH /users/me` y anuncia «Cambios guardados.». Incluye los estados de cargando, vacío (perfil sin completar) y error con «Reintentar».
- `src/components/profile/DeleteAccountModal.tsx` — ventana de confirmación simple: «Cancelar» cierra la ventana sin efectos; «Eliminar cuenta» llama a `DELETE /users/me` y, si responde, cierra la sesión y regresa al inicio (`/`). Muestra un error si falla la llamada.

### Modificados
- `src/auth/useProfileForm.ts` — permite que el propio usuario mantenga su usuario sin ver el error de "ya en uso" (el backend marca el propio username como ocupado; se valida válido en el propio).
- `src/App.tsx` — nueva ruta `/perfil` dentro de `<Route element={<Layout />}>` + `<PrivateRoute>`.
- `src/components/Layout.tsx` — «Ajustes del perfil» pasa a ser un enlace real a `/perfil`; acceso adicional en el encabezado de la barra de direcciones para celulares (el sidebar se oculta ahí).
- Miscelánea: fusión de `origin/main` (US-08: «Unirse con enlace») — conflictos resueltos conservando US-07 (editar/eliminar salas) y US-03 (cache bfcache).

### Sin cambios (ya terminados)
- `src/components/rooms/CreateRoomModal.tsx`, `src/pages/DashboardPage.tsx` (panel), `src/pages/RoomPage.tsx`, `src/rooms/RoomsProvider.tsx`, `src/services/roomService.ts`: US-06 y US-07 verificados en esta rama; no se sobreescribieron.

## Validación realizada antes del commit
- `./node_modules/.bin/tsc -b` → sin errores.
- `./node_modules/.bin/eslint` sobre los archivos cambiados → sin warnings.

## Notas
- El correo no es editable desde esta pantalla (Firebase Auth lo controla); se muestra solo para leer.
- El nombre de usuario ya existente ajeno muestra un error sin llamar a la API; el propio usuario puede salvar su actual sin cambios.
