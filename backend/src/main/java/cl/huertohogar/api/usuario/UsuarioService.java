package cl.huertohogar.api.usuario;

import cl.huertohogar.api.common.Excepciones.ConflictoException;
import cl.huertohogar.api.common.Excepciones.NoEncontradoException;
import cl.huertohogar.api.common.Excepciones.ReglaNegocioException;
import cl.huertohogar.api.common.Validaciones;
import cl.huertohogar.api.usuario.UsuarioDtos.UsuarioActualizarRequest;
import cl.huertohogar.api.usuario.UsuarioDtos.UsuarioCrearRequest;
import cl.huertohogar.api.usuario.UsuarioDtos.UsuarioResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Lógica de usuarios: creación con contraseña hasheada (BCrypt) y CRUD del administrador.
 */
@Service
@Transactional
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAllByOrderByIdUsuarioAsc().stream().map(UsuarioResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {
        return UsuarioResponse.de(buscar(id));
    }

    /** Crea un usuario nuevo. Lo usan el registro público (siempre CLIENTE) y el ADMIN. */
    public UsuarioResponse crear(String nombre, String email, String password, String telefono,
                                 String region, String comuna, NombreRol rol) {
        String emailNormalizado = Validaciones.normalizarEmail(email);
        if (usuarioRepository.existsByEmail(emailNormalizado)) {
            throw new ConflictoException("Ya existe una cuenta con este correo.");
        }
        Usuario usuario = new Usuario();
        usuario.setNombre(nombre.trim());
        usuario.setEmail(emailNormalizado);
        usuario.setPasswordHash(passwordEncoder.encode(password));
        usuario.setTelefono(Validaciones.normalizarTelefono(telefono));
        usuario.setRegion(region);
        usuario.setComuna(comuna);
        usuario.setRol(buscarRol(rol));
        usuario.setActivo(true);
        return UsuarioResponse.de(usuarioRepository.save(usuario));
    }

    public UsuarioResponse crear(UsuarioCrearRequest req) {
        return crear(req.nombre(), req.email(), req.password(), req.telefono(), req.region(), req.comuna(), req.rol());
    }

    /** Edita datos y rol. El correo no cambia; la contraseña solo si viene una nueva. */
    public UsuarioResponse actualizar(Long id, UsuarioActualizarRequest req, Long idActual) {
        Usuario usuario = buscar(id);
        validarCambioDeRol(usuario, req.rol(), idActual);

        usuario.setNombre(req.nombre().trim());
        usuario.setTelefono(Validaciones.normalizarTelefono(req.telefono()));
        usuario.setRegion(req.region());
        usuario.setComuna(req.comuna());
        usuario.setRol(buscarRol(req.rol()));
        if (req.password() != null && !req.password().isBlank()) {
            usuario.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        return UsuarioResponse.de(usuario);
    }

    public UsuarioResponse cambiarRol(Long id, NombreRol rol, Long idActual) {
        Usuario usuario = buscar(id);
        validarCambioDeRol(usuario, rol, idActual);
        usuario.setRol(buscarRol(rol));
        return UsuarioResponse.de(usuario);
    }

    public UsuarioResponse cambiarEstado(Long id, boolean activo, Long idActual) {
        Usuario usuario = buscar(id);
        if (usuario.isActivo() != activo) {
            if (usuario.getIdUsuario().equals(idActual)) {
                throw new ReglaNegocioException("No puedes desactivar tu propia cuenta.");
            }
            if (!activo) {
                asegurarOtroAdminActivo(usuario);
            }
            usuario.setActivo(activo);
        }
        return UsuarioResponse.de(usuario);
    }

    public void eliminar(Long id, Long idActual) {
        Usuario usuario = buscar(id);
        if (usuario.getIdUsuario().equals(idActual)) {
            throw new ReglaNegocioException("No puedes eliminar tu propia cuenta.");
        }
        asegurarOtroAdminActivo(usuario);
        usuarioRepository.delete(usuario);
    }

    // --- reglas de negocio ---

    private void validarCambioDeRol(Usuario usuario, NombreRol nuevoRol, Long idActual) {
        if (usuario.getRol().getNombre() == nuevoRol) {
            return;
        }
        if (usuario.getIdUsuario().equals(idActual)) {
            throw new ReglaNegocioException("No puedes cambiar tu propio rol.");
        }
        if (nuevoRol != NombreRol.ADMIN) {
            asegurarOtroAdminActivo(usuario);
        }
    }

    // Si el usuario es el último ADMIN activo, no se le puede quitar el rol, desactivar ni eliminar.
    private void asegurarOtroAdminActivo(Usuario usuario) {
        if (usuario.esAdmin() && usuario.isActivo()
                && usuarioRepository.countByRolNombreAndActivoTrue(NombreRol.ADMIN) <= 1) {
            throw new ReglaNegocioException("Debe existir al menos un administrador activo.");
        }
    }

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new NoEncontradoException("No existe el usuario " + id + "."));
    }

    private Rol buscarRol(NombreRol nombre) {
        return rolRepository.findByNombre(nombre)
                .orElseThrow(() -> new IllegalStateException("Falta el rol " + nombre + " en la base de datos."));
    }
}
