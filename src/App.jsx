import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import RutaProtegida from "./components/RutaProtegida";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CarritoProvider, useCarrito } from "./context/CarritoContext";
import { ProductosProvider } from "./context/ProductosContext";
import AdminPage from "./pages/AdminPage";
import CarritoPage from "./pages/CarritoPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegistroPage from "./pages/RegistroPage";

const CATEGORIAS_FOOTER = ["Frutas Frescas", "Verduras Orgánicas", "Productos Orgánicos"];

// Layout fuera de los providers porque necesita leer sus hooks.
function Layout() {
  const { sesion, cerrarSesion } = useAuth();
  const { totalUnidades } = useCarrito();

  return (
    <>
      <Header totalUnidades={totalUnidades} usuario={sesion} onCerrarSesion={cerrarSesion} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/carrito" element={<CarritoPage />} />
        <Route
          path="/admin"
          element={
            <RutaProtegida>
              <AdminPage />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer categorias={CATEGORIAS_FOOTER} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProductosProvider>
        <CarritoProvider>
          <BrowserRouter>
            <Layout />
          </BrowserRouter>
        </CarritoProvider>
      </ProductosProvider>
    </AuthProvider>
  );
}
