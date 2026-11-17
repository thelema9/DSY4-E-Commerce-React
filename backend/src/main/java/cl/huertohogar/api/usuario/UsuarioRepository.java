package cl.huertohogar.api.usuario;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Usuario> findAllByOrderByIdUsuarioAsc();

    // Cuántos administradores activos quedan (para no dejar el sistema sin ADMIN).
    long countByRolNombreAndActivoTrue(NombreRol nombre);
}
