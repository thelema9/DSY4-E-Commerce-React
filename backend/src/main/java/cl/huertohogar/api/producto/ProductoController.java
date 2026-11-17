package cl.huertohogar.api.producto;

import cl.huertohogar.api.producto.ProductoDtos.AlCrear;
import cl.huertohogar.api.producto.ProductoDtos.CategoriaResponse;
import cl.huertohogar.api.producto.ProductoDtos.ProductoRequest;
import cl.huertohogar.api.producto.ProductoDtos.ProductoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/**
 * Catálogo: leer es público; crear, editar y eliminar es solo para ADMIN.
 */
@RestController
@Tag(name = "Productos", description = "Catálogo y CRUD de productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping("/api/productos")
    @Operation(summary = "Listar productos (público)")
    public List<ProductoResponse> listar() {
        return productoService.listar();
    }

    @GetMapping("/api/productos/{codigo}")
    @Operation(summary = "Detalle de un producto (público)")
    public ProductoResponse obtener(@PathVariable String codigo) {
        return productoService.obtener(codigo);
    }

    @PostMapping("/api/productos")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Crear producto (ADMIN)", description = "201 · 400 validación · 401 · 403 · 409 código repetido")
    public ResponseEntity<ProductoResponse> crear(@Validated(AlCrear.class) @RequestBody ProductoRequest req) {
        ProductoResponse creado = productoService.crear(req);
        return ResponseEntity.created(URI.create("/api/productos/" + creado.codigo())).body(creado);
    }

    @PutMapping("/api/productos/{codigo}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Editar producto (ADMIN)", description = "El código de la URL no se puede cambiar")
    public ProductoResponse actualizar(@PathVariable String codigo, @Valid @RequestBody ProductoRequest req) {
        return productoService.actualizar(codigo, req);
    }

    @DeleteMapping("/api/productos/{codigo}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Eliminar producto (ADMIN)", description = "204 sin cuerpo")
    public ResponseEntity<Void> eliminar(@PathVariable String codigo) {
        productoService.eliminar(codigo);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/categorias")
    @Operation(summary = "Listar categorías (público)")
    public List<CategoriaResponse> categorias() {
        return productoService.listarCategorias();
    }
}
