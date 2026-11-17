package cl.huertohogar.api.producto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import jakarta.validation.groups.Default;

public final class ProductoDtos {

    private ProductoDtos() {
    }

    /**
     * Grupo de validación usado solo al crear (POST): ahí el código es obligatorio.
     * Al editar (PUT) el código viene en la URL y el del cuerpo se ignora.
     * Extiende Default para que al crear también se validen todas las demás reglas.
     */
    public interface AlCrear extends Default {
    }

    /** Lo que envía el frontend al crear o editar. La categoría viaja por nombre. */
    public record ProductoRequest(
            @NotBlank(groups = AlCrear.class, message = "El código es obligatorio.")
            @Size(max = 10, message = "El código admite máximo 10 caracteres.")
            String codigo,

            @NotBlank(message = "El nombre es obligatorio.")
            @Size(max = 100, message = "El nombre admite máximo 100 caracteres.")
            String nombre,

            @NotBlank(message = "La categoría es obligatoria.")
            @Size(max = 60, message = "La categoría admite máximo 60 caracteres.")
            String categoria,

            @Size(max = 120, message = "El atributo admite máximo 120 caracteres.")
            String atributo,

            @NotNull(message = "El precio es obligatorio.")
            @Positive(message = "El precio debe ser mayor a 0.")
            Integer precio,

            @NotNull(message = "El stock es obligatorio.")
            @PositiveOrZero(message = "El stock debe ser mayor o igual a 0.")
            Integer stock,

            @NotBlank(message = "La unidad es obligatoria.")
            @Size(max = 20, message = "La unidad admite máximo 20 caracteres.")
            String unidad,

            @Size(max = 1000, message = "La descripción admite máximo 1000 caracteres.")
            String descripcion,

            @Size(max = 500, message = "La URL de la imagen admite máximo 500 caracteres.")
            String imagen) {
    }

    /** Respuesta: mismo formato que espera el frontend (imagen en vez de imagen_url). */
    public record ProductoResponse(
            String codigo,
            String nombre,
            String categoria,
            String atributo,
            Integer precio,
            Integer stock,
            String unidad,
            String descripcion,
            String imagen) {

        public static ProductoResponse de(Producto p) {
            return new ProductoResponse(p.getCodigo(), p.getNombre(), p.getCategoria().getNombre(), p.getAtributo(),
                    p.getPrecio(), p.getStock(), p.getUnidad(), p.getDescripcion(), p.getImagenUrl());
        }
    }

    public record CategoriaResponse(Integer id, String nombre) {

        public static CategoriaResponse de(Categoria c) {
            return new CategoriaResponse(c.getIdCategoria(), c.getNombre());
        }
    }
}
