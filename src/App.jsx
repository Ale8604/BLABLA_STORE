import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import StorePage from './pages/Store/StorePage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import AdminLayout from './pages/Admin/AdminLayout';
import Inventario from './pages/Admin/Inventario/Inventario';
import CrearProducto from './pages/Admin/CrearProducto/CrearProducto';
import Archivados from './pages/Admin/Archivados/Archivados';
import ProtectedRoute from './components/ProtectedRoute';
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

        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/inventario" replace />} />
          <Route path="inventario" element={<PageTransition><Inventario /></PageTransition>} />
          <Route path="crear"      element={<PageTransition><CrearProducto /></PageTransition>} />
          <Route path="archivados" element={<PageTransition><Archivados /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
