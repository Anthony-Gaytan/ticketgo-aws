# TicketGo Unit Tests (.NET 8)

Este proyecto contiene las pruebas unitarias automatizadas para las reglas de negocio críticas del sistema TicketGo, utilizando:
* **xUnit** como framework de pruebas.
* **Moq** para la creación de dobles de prueba y mocks de interfaces de servicio (como `IJwtService` y `IQrService`).
* **FluentAssertions** para aserciones fluidas, legibles y expresivas.
* **EF Core InMemory Database** para simular la base de datos PostgreSQL de forma aislada y sin persistencia real en cada prueba.

---

## Estructura de Pruebas

Se cubren las siguientes clases y reglas de negocio:

1. **`EventServiceTests`**:
   * Forzar estado `PendingReview` en la creación de eventos si el usuario es `Organizer`.
   * Impedir cancelación de eventos con entradas vendidas.
   * Impedir eliminación de eventos con tickets generados.
   * Bloquear intentos de organizadores de publicar eventos directamente.
   * Bloquear edición de eventos que ya se encuentran en estado `Published` o `Cancelled` por parte del organizador.

2. **`AuthServiceTests`**:
   * Registro exitoso de usuarios.
   * Rechazo de registro con correos duplicados.
   * Login correcto con retorno de Token JWT válido.
   * Login inválido por contraseña incorrecta.

3. **`OrderServiceTests`**:
   * Compra exitosa con stock suficiente (descuenta stock, genera el ticket y llama a la generación de QR).
   * Compra rechazada por stock insuficiente.

4. **`UserServiceTests`**:
   * Obtención de perfil autenticado (`GetMeAsync`).
   * Actualización exitosa de nombre completo y correo.
   * Cambio de contraseña con validación de contraseña actual correcta y hash de la nueva clave.

---

## Cómo Ejecutar las Pruebas

Para ejecutar las pruebas en tu máquina local:

1. Asegúrate de tener instalado el **SDK de .NET 8**.
2. Abre una consola/terminal en la raíz del proyecto o en la carpeta `backend/`.
3. Ejecuta el comando:
   ```bash
   dotnet test backend/TicketGo.Tests
   ```
4. Para ver detalles más descriptivos del resultado de la ejecución, puedes correr:
   ```bash
   dotnet test backend/TicketGo.Tests --logger "console;verbosity=detailed"
   ```
