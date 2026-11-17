package cl.huertohogar.api.producto;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {

    Optional<Categoria> findByNombreIgnoreCase(String nombre);

    List<Categoria> findAllByOrderByNombreAsc();
}
