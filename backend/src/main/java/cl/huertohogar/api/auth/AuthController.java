package cl.huertohogar.api.auth;

import cl.huertohogar.api.auth.AuthDtos.LoginRequest;
import cl.huertohogar.api.auth.AuthDtos.LoginResponse;
import cl.huertohogar.api.auth.AuthDtos.RegistroRequest;
import cl.huertohogar.api.security.UsuarioAutenticado;
import cl.huertohogar.api.usuario.UsuarioDtos.UsuarioResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "Login con JWT, registro de clientes y perfil")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "200 con { token, usuario } · 401 credenciales · 403 cuenta desactivada")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registrar un cliente", description = "201 con el usuario (rol CLIENTE) · 400 · 409 correo repetido")
    public UsuarioResponse registrar(@Valid @RequestBody RegistroRequest req) {
        return authService.registrar(req);
    }

    @GetMapping("/me")
    @Operation(summary = "Usuario de la sesión actual")
    @SecurityRequirement(name = "bearerAuth")
    public UsuarioResponse perfil(@AuthenticationPrincipal UsuarioAutenticado actual) {
        return authService.perfil(actual.id());
    }
}
