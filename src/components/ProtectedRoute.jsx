import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
