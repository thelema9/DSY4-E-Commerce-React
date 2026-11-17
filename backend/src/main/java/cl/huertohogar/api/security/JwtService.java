package cl.huertohogar.api.security;

import cl.huertohogar.api.usuario.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

/**
 * Genera y valida los JWT (firma HMAC-SHA256 con JWT_SECRET).
 */
@Service
public class JwtService {

    private final SecretKey clave;
    private final long expiracionMs;

    public JwtService(@Value("${app.jwt.secret}") String secreto,
                      @Value("${app.jwt.expiration-ms}") long expiracionMs) {
        // Keys.hmacShaKeyFor exige al menos 256 bits: si el secreto es corto, la app no arranca.
        this.clave = Keys.hmacShaKeyFor(aBytes(secreto));
        this.expiracionMs = expiracionMs;
    }

    /** Token con el correo como "sub" y los datos que el front necesita (id, rol, nombre). */
    public String generarToken(Usuario usuario) {
        Date ahora = new Date();
        return Jwts.builder()
                .subject(usuario.getEmail())
                .claim("id", usuario.getIdUsuario())
                .claim("rol", usuario.getRol().getNombre().name())
                .claim("nombre", usuario.getNombre())
                .issuedAt(ahora)
                .expiration(new Date(ahora.getTime() + expiracionMs))
                .signWith(clave)
                .compact();
    }

    /** Devuelve los claims si la firma es válida y no expiró; vacío en cualquier otro caso. */
    public Optional<Claims> validar(String token) {
        try {
            return Optional.of(Jwts.parser().verifyWith(clave).build().parseSignedClaims(token).getPayload());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    // El secreto se espera en Base64 (openssl rand -base64 48); si no lo es, se usan sus bytes tal cual.
    private static byte[] aBytes(String secreto) {
        try {
            return Decoders.BASE64.decode(secreto);
        } catch (RuntimeException e) {
            return secreto.getBytes(StandardCharsets.UTF_8);
        }
    }
}
