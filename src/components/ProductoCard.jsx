// Tarjeta de producto: recibe el producto y el callback de agregar por props.
export default function ProductoCard({ producto, onAgregar }) {
  return (
    <div className="col-6 col-md-4 col-lg-3">
      <article className="card h-100">
        <img src={producto.imagen} className="card-img-top imagen" alt={producto.nombre} />
        <div className="card-body d-flex flex-column">
          <h3 className="h6">{producto.nombre}</h3>
          <p className="small text-muted mb-1">{producto.atributo}</p>
          <p className="fw-bold mb-2">
            ${producto.precio.toLocaleString("es-CL")} / {producto.unidad}
          </p>
          <button className="btn btn-success btn-sm mt-auto" onClick={() => onAgregar(producto.codigo)}>
            Agregar al carrito
          </button>
        </div>
      </article>
    </div>
  );
}
