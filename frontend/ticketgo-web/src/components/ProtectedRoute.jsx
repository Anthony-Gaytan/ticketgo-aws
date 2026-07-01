import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '80vh',
        flexDirection: 'column',
        gap: '1rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span>Validando sesión...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <div className="card text-center" style={{
          maxWidth: '450px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          padding: '2.5rem'
        }}>
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            padding: '1rem',
            borderRadius: '50%',
            color: 'var(--danger)',
            display: 'flex'
          }}>
            <ShieldAlert size={48} />
          </div>
          <h2>Acceso Restringido</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            No tienes los permisos requeridos para acceder a esta sección. Si crees que se trata de un error, contacta al soporte técnico.
          </p>
          <a href="/" className="btn btn-secondary" style={{ marginTop: '0.5rem', width: '100%' }}>
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
