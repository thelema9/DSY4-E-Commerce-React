import { useState } from "react";
import { Link } from "react-router-dom";
import { Cargando, MensajeError } from "../components/EstadoCarga";
import { useCarrito } from "../context/CarritoContext";
import { useProductos } from "../context/ProductosContext";
import * as cuponesService from "../services/cuponesService";

export default function CarritoPage() {
  const { items, actualizarCantidad, vaciarCarrito } = useCarrito();
  const { buscarProducto, cargando, error, cargarProductos } = useProductos();
  const [cupon, setCupon] = useState("");
  const [mensajeCupon, setMensajeCupon] = useState(null); // { texto, tipo }
  const [porcentaje, setPorcentaje] = useState(0); // descuento del cupón aplicado (0.1 = 10%)
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [mensajePago, setMensajePago] = useState(null);

  // Los precios salen del catálogo de la API, no de lo guardado en el carrito.
  const subtotal = items.reduce((total, item) => {
    const producto = buscarProducto(item.codigo);
    return total + (producto ? producto.precio * item.cantidad : 0);
  }, 0);

  const descuento = Math.round(subtotal * porcentaje);
  const total = Math.max(subtotal - descuento, 0);

  async function aplicarCupon() {
    const codigo = cupon.trim().toUpperCase();
    if (!codigo) return;
    setValidandoCupon(true);
    try {
      const datos = await cuponesService.validar(codigo);
      setPorcentaje(datos.porcentaje);
      setMensajeCupon({ texto: `Cupón aplicado: -${Math.round(datos.porcentaje * 100)}%`, tipo: "success" });
    } catch (e) {
      setPorcentaje(0);
      setMensajeCupon({ texto: e.status === 404 ? "Cupón inválido." : e.message, tipo: "danger" });
    } finally {
      setValidandoCupon(false);
    }
  }

  function pagar() {
    if (items.length === 0) {
      setMensajePago({ texto: "Tu carrito está vacío, agrega productos antes de pagar.", tipo: "danger" });
      return;
    }
    vaciarCarrito();
    setPorcentaje(0);
    setCupon("");
    setMensajeCupon(null);
    setMensajePago({ texto: "¡Pedido confirmado! (pago simulado, sin pasarela real)", tipo: "success" });
  }

  return (
    <main className="container py-5">
      <h1 className="mb-4">Mi carrito de compras</h1>
      {cargando && items.length > 0 && <Cargando texto="Cargando precios..." />}
      {error && <MensajeError mensaje={error} onReintentar={cargarProductos} />}
      <div className="row g-4">
        <div className="col-md-8">
          {items.length === 0 ? (
            <div className="alert alert-info">
              Tu carrito está vacío. <Link to="/#catalogo">Volver al catálogo</Link>.
            </div>
          ) : (
            items.map((item) => {
              const producto = buscarProducto(item.codigo);
              if (!producto) return null;
              return (
                <article key={item.codigo} className="card mb-3">
                  <div className="row g-0 align-items-center">
                    <div className="col-3">
                      <img
                        src={producto.imagen}
                        className="img-fluid rounded-start imagen-mini"
                        alt={producto.nombre}
                      />
                    </div>
                    <div className="col-9">
                      <div className="card-body">
                        <h3 className="h6 mb-1">{producto.nombre}</h3>
                        <p className="small text-muted mb-1">{producto.descripcion}</p>
                        <p className="fw-bold mb-2">${producto.precio.toLocaleString("es-CL")}</p>
                        <div className="input-group input-group-sm" style={{ maxWidth: "150px" }}>
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => actualizarCantidad(item.codigo, item.cantidad - 1)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="form-control text-center"
                            value={item.cantidad}
                            min="0"
                            onChange={(e) => actualizarCantidad(item.codigo, e.target.valueAsNumber || 0)}
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => actualizarCantidad(item.codigo, item.cantidad + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h2 className="h5">Resumen</h2>
              <p>
                Total: <strong>${total.toLocaleString("es-CL")}</strong>
              </p>

              <div className="mb-3">
                <label htmlFor="cupon" className="form-label">Cupón de descuento</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    id="cupon"
                    placeholder="Código"
                    value={cupon}
                    onChange={(e) => setCupon(e.target.value)}
                  />
                  <button
                    className="btn btn-outline-success"
                    type="button"
                    onClick={aplicarCupon}
                    disabled={validandoCupon}
                  >
                    Aplicar
                  </button>
                </div>
                {mensajeCupon && (
                  <div className={`small mt-1 text-${mensajeCupon.tipo}`}>{mensajeCupon.texto}</div>
                )}
              </div>

              <button className="btn btn-success w-100" type="button" onClick={pagar}>
                Pagar
              </button>
              {mensajePago && (
                <div className={`mt-2 text-${mensajePago.tipo}`}>{mensajePago.texto}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
