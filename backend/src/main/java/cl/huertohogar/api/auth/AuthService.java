package cl.huertohogar.api.auth;

import cl.huertohogar.api.auth.AuthDtos.LoginRequest;
import cl.huertohogar.api.auth.AuthDtos.LoginResponse;
import cl.huertohogar.api.auth.AuthDtos.RegistroRequest;
import cl.huertohogar.api.common.Excepciones.NoEncontradoException;
import cl.huertohogar.api.common.Validaciones;
import cl.huertohogar.api.security.JwtService;
import cl.huertohogar.api.usuario.NombreRol;
import cl.huertohogar.api.usuario.Usuario;
import cl.huertohogar.api.usuario.UsuarioDtos.UsuarioResponse;
import cl.huertohogar.api.usuario.UsuarioRepository;
import cl.huertohogar.api.usuario.UsuarioService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository, UsuarioService usuarioService,
                       PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Verifica la contraseña contra el hash BCrypt y entrega un JWT.
     * Mismo mensaje si el correo no existe o la contraseña es incorrecta (no revela qué cuentas existen).
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest req) {
        Usuario usuario = usuarioRepository.findByEmail(Validaciones.normalizarEmail(req.email()))
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Correo o contraseña incorrectos."));

        if (!usuario.isActivo()) {
            throw new DisabledException("Tu cuenta está desactivada.");
        }
        return new LoginResponse(jwtService.generarToken(usuario), UsuarioResponse.de(usuario));
    }

    /** Registro público: el rol siempre es CLIENTE, aunque el JSON intente enviar otro. */
    public UsuarioResponse registrar(RegistroRequest req) {
        return usuarioService.crear(req.nombre(), req.email(), req.password(), req.telefono(),
                req.region(), req.comuna(), NombreRol.CLIENTE);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse perfil(Long id) {
        return usuarioRepository.findById(id).map(UsuarioResponse::de)
                .orElseThrow(() -> new NoEncontradoException("No existe el usuario " + id + "."));
    }
}
