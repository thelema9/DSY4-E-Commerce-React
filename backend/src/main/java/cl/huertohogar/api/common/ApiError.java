package cl.huertohogar.api.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Formato único de error de la API (lo usa el frontend para mostrar mensajes).
 * "errores" solo aparece en los 400 de validación: { campo: mensaje }.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        int status,
        String error,
        String mensaje,
        Map<String, String> errores,
        String ruta,
        LocalDateTime timestamp) {

    public static ApiError de(HttpStatus status, String mensaje, String ruta) {
        return de(status, mensaje, null, ruta);
    }

    public static ApiError de(HttpStatus status, String mensaje, Map<String, String> errores, String ruta) {
        return new ApiError(status.value(), status.getReasonPhrase(), mensaje, errores, ruta, LocalDateTime.now());
    }
}
