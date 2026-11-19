# Fix US-04: autenticación y unicidad al editar perfil

## Cambios

- El cambio de correo reautentica al usuario con su contraseña actual o con Google y usa Firebase `verifyBeforeUpdateEmail`.
- Firebase envía el enlace al correo nuevo. El correo de inicio de sesión no cambia hasta que se confirma el enlace; la interfaz comunica que el cambio está pendiente.
- Si Firebase rechaza el correo porque ya está asociado a otra cuenta, el formulario muestra el error junto al campo.
- Al volver a la aplicación, se recarga el usuario autenticado. Si el correo actual de Firebase difiere del perfil, la app fuerza un token ID nuevo y sincroniza el correo confirmado con `PATCH /users/me`.
- Nombres y apellidos se validan por formato, pero no requieren unicidad. El username se valida en el cliente y su reserva se confirma de forma atómica en la API; otra cuenta no puede apropiarse de uno ocupado.
- La API obtiene el UID exclusivamente del token Firebase verificado. Editar mediante Swagger tampoco permite seleccionar el perfil de otra cuenta.

## Prueba manual

1. Entra con una cuenta de prueba cuyo correo actual y contraseña conozcas. Usa como correo nuevo una dirección o alias al que tengas acceso.
2. En «Mi perfil», cambia el correo y, si quieres, también el nombre, apellido y username. Confirma la contraseña cuando se solicite y guarda.
3. Comprueba que aparece el aviso de enlace enviado. Antes de abrirlo, el correo vigente debe seguir siendo el anterior.
4. Abre el enlace recibido en el correo nuevo. Vuelve a la app; el perfil debe reflejar el correo nuevo.
5. Cierra sesión e inicia con el correo nuevo y la contraseña actual. Comprueba que sigues en la misma cuenta y conservas tus salas y datos.
6. Intenta cambiar el username por uno ocupado y el correo por uno perteneciente a otra cuenta. Ambos cambios deben rechazarse con error junto al campo y no reemplazar la identidad existente.
7. Intenta PATCH `/api/v1/users/me` con el token de una cuenta y datos de perfil de otra. La API no acepta UID en el cuerpo: solo modifica el perfil del UID del token.

## Consideración sobre correos anteriores

Firebase mantiene un correo primario por cuenta. Al confirmar el nuevo, el correo antiguo deja de ser el correo de inicio de sesión de esa cuenta y puede volver a estar disponible en Firebase Auth. El perfil, salas e historial permanecen asociados al UID original; reutilizar el correo no transfiere esos datos. Mantener correos anteriores como alias bloqueados para todos los flujos de registro requeriría una política adicional que también cubra registro con Google.

## Verificación técnica

`npm run build` comprueba TypeScript y genera el bundle de Vite. Las pruebas manuales anteriores requieren una cuenta con acceso al buzón del correo nuevo.
