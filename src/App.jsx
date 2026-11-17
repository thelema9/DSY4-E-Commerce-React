import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import RutaProtegida from "./components/RutaProtegida";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CarritoProvider, useCarrito } from "./context/CarritoContext";
import { ProductosProvider, useProductos } from "./context/ProductosContext";
import AdminPage from "./pages/AdminPage";
import AdminUsuariosPage from "./pages/AdminUsuariosPage";
import CarritoPage from "./pages/CarritoPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegistroPage from "./pages/RegistroPage";

// Providers globales de la app (exportados para reutilizarlos en las pruebas).
export function Proveedores({ children }) {
  return (
    <AuthProvider>
      <ProductosProvider>
        <CarritoProvider>{children}</CarritoProvider>
      </ProductosProvider>
    </AuthProvider>
  );
}

// Layout fuera de los providers porque necesita leer sus hooks.
// Exportado para que las pruebas lo monten con un MemoryRouter.
export function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const { totalUnidades } = useCarrito();
  const { productos } = useProductos();
  // Las categorías del footer salen del catálogo que entrega la API (sin datos quemados).
  const categorias = [...new Set(productos.map((p) => p.categoria))];

  return (
    <>
      <Header totalUnidades={totalUnidades} usuario={usuario} onCerrarSesion={cerrarSesion} />
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
        <Route
          path="/admin/usuarios"
          element={
            <RutaProtegida>
              <AdminUsuariosPage />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer categorias={categorias} />
    </>
  );
}

export default function App() {
  return (
    <Proveedores>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </Proveedores>
  );
}
