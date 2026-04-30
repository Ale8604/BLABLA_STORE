import { lazy, Suspense } from 'react';
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
import ProtectedRoute from './components/ProtectedRoute';
import UserRoute from './components/UserRoute';
import PageTransition from './components/PageTransition';

const AdminLayout       = lazy(() => import('./pages/Admin/AdminLayout'));
const Dashboard         = lazy(() => import('./pages/Admin/Dashboard/Dashboard'));
const Inventario        = lazy(() => import('./pages/Admin/Inventario/Inventario'));
const CrearProducto     = lazy(() => import('./pages/Admin/CrearProducto/CrearProducto'));
const Archivados        = lazy(() => import('./pages/Admin/Archivados/Archivados'));
const Publicidad        = lazy(() => import('./pages/Admin/Publicidad/Publicidad'));
const Facturacion       = lazy(() => import('./pages/Admin/Facturacion/Facturacion'));
const ImportarProductos = lazy(() => import('./pages/Admin/ImportarProductos/ImportarProductos'));
const EditarProducto    = lazy(() => import('./pages/Admin/EditarProducto/EditarProducto'));
const QuitarFondos      = lazy(() => import('./pages/Admin/QuitarFondos/QuitarFondos'));
const Fotos             = lazy(() => import('./pages/Admin/Fotos/Fotos'));

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

        <Route path="/admin" element={<ProtectedRoute><Suspense fallback={null}><AdminLayout /></Suspense></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"    element={<Suspense fallback={null}><PageTransition><Dashboard /></PageTransition></Suspense>} />
          <Route path="inventario"   element={<Suspense fallback={null}><PageTransition><Inventario /></PageTransition></Suspense>} />
          <Route path="crear"        element={<Suspense fallback={null}><PageTransition><CrearProducto /></PageTransition></Suspense>} />
          <Route path="archivados"   element={<Suspense fallback={null}><PageTransition><Archivados /></PageTransition></Suspense>} />
          <Route path="publicidad"   element={<Suspense fallback={null}><PageTransition><Publicidad /></PageTransition></Suspense>} />
          <Route path="facturacion"  element={<Suspense fallback={null}><PageTransition><Facturacion /></PageTransition></Suspense>} />
          <Route path="importar"     element={<Suspense fallback={null}><PageTransition><ImportarProductos /></PageTransition></Suspense>} />
          <Route path="editar"       element={<Suspense fallback={null}><PageTransition><EditarProducto /></PageTransition></Suspense>} />
          <Route path="quitar-fondos" element={<Suspense fallback={null}><PageTransition><QuitarFondos /></PageTransition></Suspense>} />
          <Route path="fotos"        element={<Suspense fallback={null}><PageTransition><Fotos /></PageTransition></Suspense>} />
        </Route>

        <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
