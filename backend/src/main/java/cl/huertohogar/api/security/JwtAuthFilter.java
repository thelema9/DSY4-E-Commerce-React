package cl.huertohogar.api.security;

import cl.huertohogar.api.usuario.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Lee "Authorization: Bearer <token>" y, si es válido, autentica la petición.
 *
 * - El rol se toma de la base de datos (no del token): si el ADMIN cambia el rol o desactiva
 *   a alguien, el cambio aplica de inmediato aunque su token siga vigente.
 * - Si el token es inválido o expiró, NO responde error: la petición sigue como anónima.
 *   Así las rutas públicas funcionan aunque el navegador envíe un token viejo,
 *   y las privadas terminan en 401 (JsonSecurityHandlers).
 *
 * No es un @Component a propósito: se registra solo dentro de la cadena de Spring Security
 * (SecurityConfig) para que no se ejecute dos veces.
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            jwtService.validar(header.substring(7))
                    .map(claims -> claims.get("id", Long.class))
                    .flatMap(usuarioRepository::findById)
                    .filter(usuario -> usuario.isActivo())
                    .ifPresent(usuario -> {
                        String rol = usuario.getRol().getNombre().name();
                        var principal = new UsuarioAutenticado(usuario.getIdUsuario(), usuario.getEmail(), rol);
                        var autoridades = List.of(new SimpleGrantedAuthority("ROLE_" + rol));
                        var autenticacion = new UsernamePasswordAuthenticationToken(principal, null, autoridades);
                        SecurityContextHolder.getContext().setAuthentication(autenticacion);
                    });
        }

        chain.doFilter(request, response);
    }
}
