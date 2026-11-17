package cl.huertohogar.api.config;

import cl.huertohogar.api.security.JsonSecurityHandlers;
import cl.huertohogar.api.security.JwtAuthFilter;
import cl.huertohogar.api.security.JwtService;
import cl.huertohogar.api.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Seguridad de la API: JWT sin sesión, BCrypt, reglas por rol y CORS.
 * La seguridad se valida aquí (backend), no solo ocultando botones en el frontend.
 */
@Configuration
@EnableMethodSecurity // habilita @PreAuthorize en los controladores
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService,
                                           UsuarioRepository usuarioRepository,
                                           JsonSecurityHandlers handlers) throws Exception {
        http
                // API REST con JWT: sin cookies de sesión, por eso CSRF no aplica.
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(handlers.sinAutenticar())   // 401
                        .accessDeniedHandler(handlers.sinPermisos()))         // 403
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Públicos
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/registro").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/productos/**", "/api/categorias/**", "/api/cupones/**")
                        .permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/swagger-ui.html",
                                "/swagger-ui/**", "/v3/api-docs/**", "/error").permitAll()
                        // Solo ADMIN: escribir productos y todo el CRUD de usuarios
                        .requestMatchers("/api/productos/**").hasRole("ADMIN")
                        .requestMatchers("/api/usuarios/**").hasRole("ADMIN")
                        // Cualquier otra ruta (por ejemplo /api/auth/me) requiere sesión
                        .anyRequest().authenticated())
                .addFilterBefore(new JwtAuthFilter(jwtService, usuarioRepository),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /** Orígenes permitidos desde CORS_ALLOWED_ORIGINS (separados por coma). */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") String origenes) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(origenes.split(","))
                .map(String::trim)
                .filter(o -> !o.isEmpty())
                .toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setExposedHeaders(List.of("Location"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
