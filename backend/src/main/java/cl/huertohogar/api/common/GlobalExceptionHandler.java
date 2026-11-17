package cl.huertohogar.api.common;

import cl.huertohogar.api.common.Excepciones.ConflictoException;
import cl.huertohogar.api.common.Excepciones.NoEncontradoException;
import cl.huertohogar.api.common.Excepciones.ReglaNegocioException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Traduce las excepciones a respuestas JSON con el formato ApiError y el código HTTP correcto.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 400: falló @Valid. Se devuelve un mensaje por campo para pintarlo bajo cada input del front.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validacion(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errores.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return responder(HttpStatus.BAD_REQUEST, "Los datos enviados no son válidos.", errores, req);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> jsonInvalido(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return responder(HttpStatus.BAD_REQUEST, "El cuerpo de la petición no es válido.", null, req);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> parametroInvalido(MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
        return responder(HttpStatus.BAD_REQUEST, "El parámetro '" + ex.getName() + "' no es válido.", null, req);
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<ApiError> reglaNegocio(ReglaNegocioException ex, HttpServletRequest req) {
        return responder(HttpStatus.BAD_REQUEST, ex.getMessage(), null, req);
    }

    // 401: login con correo o contraseña incorrectos.
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> credenciales(BadCredentialsException ex, HttpServletRequest req) {
        return responder(HttpStatus.UNAUTHORIZED, ex.getMessage(), null, req);
    }

    // 403: login de una cuenta desactivada.
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> cuentaDesactivada(DisabledException ex, HttpServletRequest req) {
        return responder(HttpStatus.FORBIDDEN, ex.getMessage(), null, req);
    }

    // 403: un @PreAuthorize rechazó al usuario (por ejemplo, un CLIENTE en una acción de ADMIN).
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> accesoDenegado(AccessDeniedException ex, HttpServletRequest req) {
        return responder(HttpStatus.FORBIDDEN, "No tienes permisos para realizar esta acción.", null, req);
    }

    @ExceptionHandler({NoEncontradoException.class})
    public ResponseEntity<ApiError> noEncontrado(RuntimeException ex, HttpServletRequest req) {
        return responder(HttpStatus.NOT_FOUND, ex.getMessage(), null, req);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> rutaInexistente(NoResourceFoundException ex, HttpServletRequest req) {
        return responder(HttpStatus.NOT_FOUND, "La ruta solicitada no existe.", null, req);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> metodoNoPermitido(HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
        return responder(HttpStatus.METHOD_NOT_ALLOWED, "Método HTTP no permitido en esta ruta.", null, req);
    }

    @ExceptionHandler(ConflictoException.class)
    public ResponseEntity<ApiError> conflicto(ConflictoException ex, HttpServletRequest req) {
        return responder(HttpStatus.CONFLICT, ex.getMessage(), null, req);
    }

    // Respaldo: una restricción de la base de datos (UNIQUE, FK, CHECK) que no se validó antes.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> integridad(DataIntegrityViolationException ex, HttpServletRequest req) {
        log.warn("Violación de integridad en {}: {}", req.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return responder(HttpStatus.CONFLICT, "La operación entra en conflicto con los datos existentes.", null, req);
    }

    // 500: error no previsto. Se registra completo en el log pero no se expone al cliente.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> inesperado(Exception ex, HttpServletRequest req) {
        log.error("Error no controlado en {} {}", req.getMethod(), req.getRequestURI(), ex);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor.", null, req);
    }

    private ResponseEntity<ApiError> responder(HttpStatus status, String mensaje, Map<String, String> errores,
                                               HttpServletRequest req) {
        return ResponseEntity.status(status).body(ApiError.de(status, mensaje, errores, req.getRequestURI()));
    }
}
