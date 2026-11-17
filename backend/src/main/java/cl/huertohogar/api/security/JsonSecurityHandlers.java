package cl.huertohogar.api.security;

import cl.huertohogar.api.common.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Respuestas JSON de Spring Security con el mismo formato que el resto de la API:
 * 401 cuando no hay sesión válida y 403 cuando el rol no alcanza.
 */
@Component
public class JsonSecurityHandlers {

    private final ObjectMapper objectMapper;

    public JsonSecurityHandlers(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AuthenticationEntryPoint sinAutenticar() {
        return (request, response, ex) ->
                escribir(request, response, HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para continuar.");
    }

    public AccessDeniedHandler sinPermisos() {
        return (request, response, ex) ->
                escribir(request, response, HttpStatus.FORBIDDEN, "No tienes permisos para realizar esta acción.");
    }

    private void escribir(HttpServletRequest request, HttpServletResponse response, HttpStatus status,
                          String mensaje) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getOutputStream(), ApiError.de(status, mensaje, request.getRequestURI()));
    }
}
