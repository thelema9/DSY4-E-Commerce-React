import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ProductoCard from "../components/ProductoCard";
import { useCarrito } from "../context/CarritoContext";
import { useProductos } from "../context/ProductosContext";

export default function HomePage() {
  const { productos } = useProductos();
  const { agregarAlCarrito } = useCarrito();
  const { hash, key } = useLocation();

  // React Router no hace scroll a los anclas (/#catalogo): lo hacemos al navegar.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash, key]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-md-6">
              <h1>Del campo a tu hogar</h1>
              <p className="lead">
                Frutas, verduras y productos orgánicos frescos, directo desde el campo chileno
                hasta tu puerta.
              </p>
              <a href="#catalogo" className="btn btn-success btn-lg">
                Ver productos
              </a>
            </div>
            <div className="col-md-6">
              <img src="/logo_trasnparente.png" className="hero-img" alt="Logo de HuertoHogar" />
            </div>
          </div>
        </div>
      </section>

      <section id="catalogo" className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-4">Nuestros productos</h2>
          <div className="row g-4">
            {productos.map((producto) => (
              <ProductoCard
                key={producto.codigo}
                producto={producto}
                onAgregar={(codigo) => agregarAlCarrito(codigo, 1)}
              />
            ))}
          </div>
        </div>
      </section>

      <article className="py-5 bg-white">
        <div className="container">
          <h2 className="text-center mb-4">Nuestra Visión</h2>
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <p className="lead">
                En HuertoHogar creemos que el acceso a alimentos frescos y de calidad es un{" "}
                <em>derecho</em>, no un privilegio. Nuestra visión es conectar directamente a las
                familias chilenas con los agricultores del campo, eliminando intermediarios y
                garantizando precios justos, productos más frescos y un futuro más sustentable para
                nuestra comunidad.
              </p>
              <p>
                Trabajamos día a día para promover la agricultura responsable, apoyar a los
                productores locales y construir una cadena alimentaria más transparente y ecológica.
              </p>
            </div>
          </div>
        </div>
      </article>

      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-4">Conoce HuertoHogar</h2>
          <div className="ratio ratio-16x9">
            <video controls>
              <source
                src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                type="video/mp4"
              />
              Tu navegador no soporta el elemento de video.
            </video>
          </div>
        </div>
      </section>
    </>
  );
}
