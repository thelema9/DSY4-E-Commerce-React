import { useState } from "react";

// Footer recibe la lista de categorías por props.
export default function Footer({ categorias = [] }) {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState(null); // { texto, tipo }

  function manejarBoletin(evento) {
    evento.preventDefault();
    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valido) {
      setMensaje({ texto: "Ingresa un correo válido.", tipo: "danger" });
      return;
    }
    setMensaje({ texto: "¡Gracias por suscribirte!", tipo: "success" });
    setEmail("");
  }

  return (
    <footer className="text-light py-4">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <h3 className="h5 text-white">HuertoHogar</h3>
            <p>Del campo a tu hogar.</p>
          </div>
          <div className="col-md-4">
            <h3 className="h5 text-white">Categorías</h3>
            <ul className="list-unstyled">
              {categorias.map((categoria) => (
                <li key={categoria}>{categoria}</li>
              ))}
            </ul>
          </div>
          <div className="col-md-4">
            <h3 className="h5 text-white">Medios de pago</h3>
            <p>Débito · Crédito · Transferencia</p>
            <form className="d-flex gap-2" onSubmit={manejarBoletin} novalidate>
              <label htmlFor="email-boletin" className="visually-hidden">
                Correo para el boletín
              </label>
              <input
                type="email"
                id="email-boletin"
                className="form-control form-control-sm"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button className="btn btn-success btn-sm" type="submit">
                Suscribirme
              </button>
            </form>
            {mensaje && (
              <div className={`small mt-1 text-${mensaje.tipo}`}>{mensaje.texto}</div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
