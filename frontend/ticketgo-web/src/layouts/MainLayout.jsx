import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Ticket, User as UserIcon, LogOut, LogIn, UserPlus, LayoutDashboard, Menu, X } from 'lucide-react';

export const MainLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--bg-navbar)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        transition: 'all var(--transition-fast)'
      }}>
        <div className="container" style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between',
          justifyContent: 'space-between'
        }}>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              color: '#fff',
              padding: '0.5rem',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <Ticket size={22} />
            </div>
            <span>TicketGo<span style={{ color: 'var(--primary)' }}>.pe</span></span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Eventos</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/my-tickets" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Mis Entradas</Link>
                {(user?.role === 'Admin' || user?.role === 'Organizer') && (
                  <Link to="/admin" style={{
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <LayoutDashboard size={16} /> Panel
                  </Link>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</div>
                  </div>
                  <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%', width: '38px', height: '38px' }} title="Cerrar Sesión">
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  <LogIn size={16} /> Iniciar Sesión
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  <UserPlus size={16} /> Registrarse
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Section */}
      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border-color)',
        padding: '3rem 0',
        marginTop: 'auto',
        color: 'var(--text-secondary)',
        fontSize: '0.875rem'
      }}>
        <div className="container" style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '2.5rem'
        }}>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.125rem', marginBottom: '0.75rem' }}>TicketGo Perú</div>
            <p style={{ maxWidth: '280px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Plataforma digital para la distribución y validación de entradas con alta disponibilidad y tecnología Cloud Native.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '4rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Enlaces</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><Link to="/" style={{ color: 'var(--text-muted)' }}>Catálogo de Eventos</Link></li>
                <li><Link to="/my-tickets" style={{ color: 'var(--text-muted)' }}>Mis Entradas</Link></li>
              </ul>
            </div>
            
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Seguridad</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><span style={{ color: 'var(--text-muted)' }}>Cifrado SSL/TLS 1.2</span></li>
                <li><span style={{ color: 'var(--text-muted)' }}>Tickets con QR Protegido</span></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="container" style={{
          borderTop: '1px solid var(--border-color)',
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.75rem'
        }}>
          &copy; {new Date().getFullYear()} TicketGo Perú. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};
