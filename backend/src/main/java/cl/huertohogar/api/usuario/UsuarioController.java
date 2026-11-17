package cl.huertohogar.api.usuario;

import cl.huertohogar.api.security.UsuarioAutenticado;
import cl.huertohogar.api.usuario.UsuarioDtos.CambioEstadoRequest;
import cl.huertohogar.api.usuario.UsuarioDtos.CambioRolRequest;
import cl.huertohogar.api.usuario.UsuarioDtos.UsuarioActualizarRequest;
import cl.huertohogar.api.usuario.UsuarioDtos.UsuarioCrearRequest;
import cl.huertohogar.api.usuario.UsuarioDtos.UsuarioResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/**
 * CRUD de usuarios. Todo el controlador es solo para ADMIN: un CLIENTE recibe 403
 * (lo aplica SecurityConfig por URL y además @PreAuthorize aquí).
 */
@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Usuarios", description = "CRUD de usuarios (solo ADMIN)")
@SecurityRequirement(name = "bearerAuth")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    @Operation(summary = "Listar usuarios")
    public List<UsuarioResponse> listar() {
        return usuarioService.listar();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener un usuario por id")
    public UsuarioResponse obtener(@PathVariable Long id) {
        return usuarioService.obtener(id);
    }

    @PostMapping
    @Operation(summary = "Crear usuario (con rol ADMIN o CLIENTE)")
    public ResponseEntity<UsuarioResponse> crear(@Valid @RequestBody UsuarioCrearRequest req) {
        UsuarioResponse creado = usuarioService.crear(req);
        return ResponseEntity.created(URI.create("/api/usuarios/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar usuario (el correo no cambia; password vacío = mantener)")
    public UsuarioResponse actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioActualizarRequest req,
                                      @AuthenticationPrincipal UsuarioAutenticado actual) {
        return usuarioService.actualizar(id, req, actual.id());
    }

    @PatchMapping("/{id}/rol")
    @Operation(summary = "Cambiar el rol de un usuario")
    public UsuarioResponse cambiarRol(@PathVariable Long id, @Valid @RequestBody CambioRolRequest req,
                                      @AuthenticationPrincipal UsuarioAutenticado actual) {
        return usuarioService.cambiarRol(id, req.rol(), actual.id());
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Activar o desactivar un usuario")
    public UsuarioResponse cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambioEstadoRequest req,
                                         @AuthenticationPrincipal UsuarioAutenticado actual) {
        return usuarioService.cambiarEstado(id, req.activo(), actual.id());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un usuario")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, @AuthenticationPrincipal UsuarioAutenticado actual) {
        usuarioService.eliminar(id, actual.id());
        return ResponseEntity.noContent().build();
    }
}
