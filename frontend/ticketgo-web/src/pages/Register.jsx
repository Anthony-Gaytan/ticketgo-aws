import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/apiClient';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await apiClient.post('/api/Auth/register', {
        fullName,
        email,
        password,
        role: 'Customer' // default role
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Error al intentar registrar el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ padding: '2.5rem 2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Crear Cuenta</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Regístrate gratis y compra tus entradas al instante
        </p>
      </div>

      {success ? (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--success)',
          padding: '1.5rem',
          borderRadius: '8px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <CheckCircle size={32} />
          <h4 style={{ margin: 0, fontWeight: 700 }}>¡Registro Exitoso!</h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Redirigiéndote a la pantalla de login en unos segundos...
          </p>
        </div>
      ) : (
        <>
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
              <label className="form-label" htmlFor="fullName">Nombre completo</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <UserIcon size={16} />
                </span>
                <input
                  id="fullName"
                  type="text"
                  className="form-input"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

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
              <label className="form-label" htmlFor="password">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  minLength={6}
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
                  <UserPlus size={16} /> Crear Cuenta
                </>
              )}
            </button>
          </form>
        </>
      )}

      <div style={{
        marginTop: '1.5rem',
        textAlign: 'center',
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)'
      }}>
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)' }}>
          Inicia sesión
        </Link>
      </div>
    </div>
  );
};
