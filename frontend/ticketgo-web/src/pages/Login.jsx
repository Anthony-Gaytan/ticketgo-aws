import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa correo y contraseña.');
      return;
    }

    setError('');
    setSubmitting(true);
    
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Credenciales de acceso incorrectas.');
    }
  };

  return (
    <div className="card" style={{ padding: '2.5rem 2rem', border: '1px solid var(--border-color)' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Iniciar Sesión</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Ingresa tus datos para gestionar y comprar tus entradas
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          color: 'var(--danger)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8125rem',
          marginBottom: '1.25rem'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Correo electrónico</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Mail size={16} />
            </span>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" htmlFor="password">Contraseña</label>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Lock size={16} />
            </span>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '1rem', height: '42px' }}
          disabled={submitting}
        >
          {submitting ? (
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          ) : (
            <>
              <LogIn size={16} /> Acceder a mi Cuenta
            </>
          )}
        </button>
      </form>

      <div style={{
        marginTop: '1.5rem',
        textAlign: 'center',
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)'
      }}>
        ¿Nuevo en TicketGo?{' '}
        <Link to="/register" style={{ fontWeight: 600, color: 'var(--primary)' }}>
          Regístrate aquí
        </Link>
      </div>

      <div style={{
        marginTop: '1.5rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        lineHeight: '1.5'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Credenciales semilla para pruebas:</div>
        <div>Cliente: <strong>juan.perez@gmail.com</strong> / <strong>Customer123!</strong></div>
        <div>Organizador: <strong>organizer@ticketgo.pe</strong> / <strong>Organizer123!</strong></div>
        <div>Administrador: <strong>admin@ticketgo.pe</strong> / <strong>Admin123!</strong></div>
      </div>
    </div>
  );
};
