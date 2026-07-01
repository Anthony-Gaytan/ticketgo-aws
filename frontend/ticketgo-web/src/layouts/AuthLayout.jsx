import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Ticket } from 'lucide-react';

export const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)'
    }}>
      {/* Visual Side Banner (Hidden on small screens) */}
      <div style={{
        flex: 1.2,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #090514 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'between',
        justifyContent: 'space-between',
        padding: '3rem',
        color: '#ffffff',
        overflow: 'hidden'
      }} className="auth-banner">
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }} />

        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#ffffff',
          zIndex: 10
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            padding: '0.5rem',
            borderRadius: '8px',
            display: 'flex'
          }}>
            <Ticket size={22} />
          </div>
          <span>TicketGo<span style={{ color: 'var(--primary)' }}>.pe</span></span>
        </Link>

        <div style={{ zIndex: 10, maxWidth: '480px', marginTop: 'auto', marginBottom: 'auto' }}>
          <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.25rem', lineHeight: '1.15' }}>
            Tu acceso seguro a los mejores eventos masivos
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', lineHeight: '1.6' }}>
            Compra entradas de forma rápida, segura y asíncrona. Validamos tus comprobantes al instante y generamos accesos QR encriptados.
          </p>
        </div>

        <div style={{ zIndex: 10, color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>
          &copy; {new Date().getFullYear()} TicketGo Perú. Arquitectura Cloud Native sobre AWS.
        </div>

        <style>{`
          @media (max-width: 900px) {
            .auth-banner {
              display: none !important;
            }
          }
        `}</style>
      </div>

      {/* Auth Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
