package cl.huertohogar.api.auth;

import cl.huertohogar.api.common.Validaciones;
import cl.huertohogar.api.usuario.UsuarioDtos.UsuarioResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    // Sin @Email a propósito: el servicio normaliza el correo (trim + minúsculas) y,
    // si no corresponde a ninguna cuenta, responde 401 igual que con una contraseña incorrecta.
    public record LoginRequest(
            @NotBlank(message = "El correo es obligatorio.")
            String email,

            @NotBlank(message = "La contraseña es obligatoria.")
            String password) {
    }

    /** Respuesta del login: el token JWT y los datos del usuario para el frontend. */
    public record LoginResponse(String token, UsuarioResponse usuario) {
    }

    /** Registro público. No tiene campo "rol": siempre se crea un CLIENTE. */
    public record RegistroRequest(
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
            String comuna) {
    }
}
