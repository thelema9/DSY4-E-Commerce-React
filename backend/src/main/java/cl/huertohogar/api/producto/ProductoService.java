package cl.huertohogar.api.producto;

import cl.huertohogar.api.common.Excepciones.ConflictoException;
import cl.huertohogar.api.common.Excepciones.NoEncontradoException;
import cl.huertohogar.api.producto.ProductoDtos.CategoriaResponse;
import cl.huertohogar.api.producto.ProductoDtos.ProductoRequest;
import cl.huertohogar.api.producto.ProductoDtos.ProductoResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    public ProductoService(ProductoRepository productoRepository, CategoriaRepository categoriaRepository) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> listar() {
        return productoRepository.findAllByOrderByCodigoAsc().stream().map(ProductoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ProductoResponse obtener(String codigo) {
        return ProductoResponse.de(buscar(codigo));
    }

    public ProductoResponse crear(ProductoRequest req) {
        String codigo = req.codigo().trim().toUpperCase();
        if (productoRepository.existsById(codigo)) {
            throw new ConflictoException("Ya existe un producto con el código " + codigo + ".");
        }
        Producto producto = new Producto(codigo);
        copiarDatos(req, producto);
        return ProductoResponse.de(productoRepository.save(producto));
    }

    /** El código de la URL manda: no se puede cambiar el código de un producto existente. */
    public ProductoResponse actualizar(String codigo, ProductoRequest req) {
        Producto producto = buscar(codigo);
        copiarDatos(req, producto);
        return ProductoResponse.de(producto);
    }

    public void eliminar(String codigo) {
        productoRepository.delete(buscar(codigo));
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listarCategorias() {
        return categoriaRepository.findAllByOrderByNombreAsc().stream().map(CategoriaResponse::de).toList();
    }

    private void copiarDatos(ProductoRequest req, Producto producto) {
        producto.setNombre(req.nombre().trim());
        producto.setCategoria(obtenerOCrearCategoria(req.categoria().trim()));
        producto.setAtributo(textoOpcional(req.atributo()));
        producto.setPrecio(req.precio());
        producto.setStock(req.stock());
        producto.setUnidad(req.unidad().trim());
        producto.setDescripcion(textoOpcional(req.descripcion()));
        producto.setImagenUrl(textoOpcional(req.imagen()));
    }

    // La categoría llega por nombre desde el formulario: si no existe, se crea.
    private Categoria obtenerOCrearCategoria(String nombre) {
        return categoriaRepository.findByNombreIgnoreCase(nombre)
                .orElseGet(() -> categoriaRepository.save(new Categoria(nombre)));
    }

    private Producto buscar(String codigo) {
        String normalizado = codigo.trim().toUpperCase();
        return productoRepository.findById(normalizado)
                .orElseThrow(() -> new NoEncontradoException("No existe el producto " + normalizado + "."));
    }

    private static String textoOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
