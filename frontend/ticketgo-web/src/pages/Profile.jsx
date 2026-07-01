import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/apiClient';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';

export const Profile = () => {
  const { user, refreshProfile } = useAuth();
  
  // Profile form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Initialize fields with context user data
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Submit profile edit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    
    if (!fullName.trim() || !email.trim()) {
      setProfileError('Todos los campos son obligatorios.');
      return;
    }

    setProfileLoading(true);

    try {
      await apiClient.put('/api/Users/me', {
        fullName,
        email
      });
      
      // Update state in context dynamically
      await refreshProfile();
      setProfileSuccess('Perfil actualizado correctamente.');
      
      setTimeout(() => {
        setProfileSuccess('');
      }, 3500);

    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError(err.message || 'Error al actualizar el perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Submit password change
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Todos los campos de contraseña son obligatorios.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden.');
      return;
    }

    // Client-side password strength validation
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (newPassword.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setPasswordError('La nueva contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo.');
      return;
    }

    setPasswordLoading(true);

    try {
      await apiClient.put('/api/Users/me/password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      setPasswordSuccess('Contraseña actualizada correctamente.');
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setPasswordSuccess('');
      }, 4000);

    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Mi Cuenta ⚙️</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Administra tus datos personales, verifica tu nivel de rol e incrementa la seguridad de tu acceso.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '2rem'
      }} className="profile-grid">
        
        {/* Left Card: Profile Data Form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Datos Personales</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              Actualiza tu información básica de contacto.
            </p>
          </div>

          {profileSuccess && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div style={{
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem'
            }}>
              <AlertCircle size={16} />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            {/* Display Read-Only Role Badge */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Shield size={14} /> Nivel de Privilegios / Rol
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
                <span className={`badge ${
                  user?.role === 'Admin' 
                    ? 'badge-danger' 
                    : user?.role === 'Organizer' 
                      ? 'badge-warning' 
                      : 'badge-success'
                }`} style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
                  {user?.role === 'Admin' ? 'Administrador' : user?.role === 'Organizer' ? 'Organizador' : 'Cliente'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  (No editable por seguridad)
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '42px' }}
              disabled={profileLoading}
            >
              {profileLoading ? (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        {/* Right Card: Password Form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>Seguridad de Acceso</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              Actualiza periódicamente tu contraseña.
            </p>
          </div>

          {passwordSuccess && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div style={{
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem'
            }}>
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">Contraseña actual</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <Lock size={16} />
                </span>
                <input
                  id="currentPassword"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">Nueva contraseña</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <KeyRound size={16} />
                </span>
                <input
                  id="newPassword"
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" htmlFor="confirmPassword">Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <KeyRound size={16} />
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="Repite la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '42px' }}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>

      </div>
      <style>{`
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};
