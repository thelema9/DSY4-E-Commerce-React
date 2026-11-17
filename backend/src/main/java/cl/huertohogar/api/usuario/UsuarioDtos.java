package cl.huertohogar.api.usuario;

import cl.huertohogar.api.common.Validaciones;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * DTOs de usuarios: lo que entra (requests validados) y lo que sale (sin el hash de la contraseña).
 */
public final class UsuarioDtos {

    private UsuarioDtos() {
    }

    /** Respuesta: nunca incluye la contraseña ni su hash. */
    public record UsuarioResponse(
            Long id,
            String nombre,
            String email,
            String telefono,
            String region,
            String comuna,
            String rol,
            boolean activo,
            LocalDateTime fechaRegistro) {

        public static UsuarioResponse de(Usuario u) {
            return new UsuarioResponse(u.getIdUsuario(), u.getNombre(), u.getEmail(), u.getTelefono(),
                    u.getRegion(), u.getComuna(), u.getRol().getNombre().name(), u.isActivo(), u.getFechaRegistro());
        }
    }

    /** POST /api/usuarios (ADMIN crea un usuario con el rol que elija). */
    public record UsuarioCrearRequest(
            @NotBlank(message = "El nombre es obligatorio.")
            @Pattern(regexp = Validaciones.NOMBRE, message = Validaciones.MENSAJE_NOMBRE)
            String nombre,

            @NotBlank(message = "El correo es obligatorio.")
            @Email(message = "Ingresa un correo con formato válido.")
            @Size(max = 120, message = "El correo admite máximo 120 caracteres.")
            String email,

            @NotBlank(message = "La contraseña es obligatoria.")
            @Pattern(regexp = Validaciones.PASSWORD, message = Validaciones.MENSAJE_PASSWORD)
            String password,

            @Pattern(regexp = Validaciones.TELEFONO, message = Validaciones.MENSAJE_TELEFONO)
            String telefono,

            @NotBlank(message = "Selecciona una región.")
            @Size(max = 80)
            String region,

            @NotBlank(message = "Selecciona una comuna.")
            @Size(max = 80)
            String comuna,

            @NotNull(message = "Selecciona un rol.")
            NombreRol rol) {
    }

    /** PUT /api/usuarios/{id}: el correo no se cambia; password vacío o ausente = mantener la actual. */
    public record UsuarioActualizarRequest(
            @NotBlank(message = "El nombre es obligatorio.")
            @Pattern(regexp = Validaciones.NOMBRE, message = Validaciones.MENSAJE_NOMBRE)
            String nombre,

            @Pattern(regexp = Validaciones.TELEFONO, message = Validaciones.MENSAJE_TELEFONO)
            String telefono,

            @NotBlank(message = "Selecciona una región.")
            @Size(max = 80)
            String region,

            @NotBlank(message = "Selecciona una comuna.")
            @Size(max = 80)
            String comuna,

            @NotNull(message = "Selecciona un rol.")
            NombreRol rol,

            @Pattern(regexp = "^$|" + Validaciones.PASSWORD, message = Validaciones.MENSAJE_PASSWORD)
            String password) {
    }

    /** PATCH /api/usuarios/{id}/rol */
    public record CambioRolRequest(@NotNull(message = "El rol es obligatorio.") NombreRol rol) {
    }

    /** PATCH /api/usuarios/{id}/estado */
    public record CambioEstadoRequest(@NotNull(message = "El estado es obligatorio.") Boolean activo) {
    }
}
