package cl.huertohogar.api.security;

/**
 * Usuario dueño del token en la petición actual. Se obtiene en los controladores con
 * {@code @AuthenticationPrincipal UsuarioAutenticado actual}.
 */
public record UsuarioAutenticado(Long id, String email, String rol) {
}
