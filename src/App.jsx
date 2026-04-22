import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import StorePage from './pages/Store/StorePage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import NosotrosPage from './pages/Nosotros/NosotrosPage';
import OfertasPage from './pages/Ofertas/OfertasPage';
import PerfilPage from './pages/Perfil/PerfilPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import AdminLayout from './pages/Admin/AdminLayout';
import Dashboard from './pages/Admin/Dashboard/Dashboard';
import Inventario from './pages/Admin/Inventario/Inventario';
import CrearProducto from './pages/Admin/CrearProducto/CrearProducto';
import Archivados from './pages/Admin/Archivados/Archivados';
import Publicidad from './pages/Admin/Publicidad/Publicidad';
import Facturacion from './pages/Admin/Facturacion/Facturacion';
import ProtectedRoute from './components/ProtectedRoute';
import UserRoute from './components/UserRoute';
import PageTransition from './components/PageTransition';

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><StorePage /></PageTransition>} />
        <Route path="/login"             element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/registro"          element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/olvide-contrasena" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/producto/:id"      element={<PageTransition><ProductDetail /></PageTransition>} />
        <Route path="/nosotros"          element={<PageTransition><NosotrosPage /></PageTransition>} />
        <Route path="/ofertas"           element={<PageTransition><OfertasPage /></PageTransition>} />
        <Route path="/perfil"            element={<UserRoute><PageTransition><PerfilPage /></PageTransition></UserRoute>} />

        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"  element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="inventario" element={<PageTransition><Inventario /></PageTransition>} />
          <Route path="crear"      element={<PageTransition><CrearProducto /></PageTransition>} />
          <Route path="archivados"  element={<PageTransition><Archivados /></PageTransition>} />
          <Route path="publicidad"   element={<PageTransition><Publicidad /></PageTransition>} />
          <Route path="facturacion"  element={<PageTransition><Facturacion /></PageTransition>} />
        </Route>

        <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
