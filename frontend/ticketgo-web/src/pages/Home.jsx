import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Tag, Search } from 'lucide-react';
import { apiClient } from '../api/apiClient';

export const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiClient.get('/api/Events');
        // Filter out deleted events and only show published events
        setEvents(data ? data.filter(e => !e.isDeleted && e.status === 'Published') : []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
        borderRadius: '16px',
        padding: '3rem 2rem',
        textAlign: 'center',
        color: '#fff',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
          filter: 'blur(30px)'
        }} />

        <h1 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '0.75rem', fontWeight: 800 }}>
          Descubre los Eventos Más Exclusivos
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '600px', margin: '0 auto 1.5rem', fontSize: '0.9375rem' }}>
          Adquiere tus entradas de forma segura. Validamos accesos de forma instantánea y garantizamos tu ingreso al concierto o partido.
        </p>

        {/* Search Bar */}
        <div style={{
          display: 'flex',
          maxWidth: '500px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex'
          }}>
            <Search size={18} />
          </div>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por concierto, estadio, ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: '2.5rem',
              borderRadius: '24px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              height: '46px'
            }}
          />
        </div>
      </div>

      {/* Grid Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Próximos Eventos</h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {filteredEvents.length} eventos encontrados
        </span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="card" style={{ height: '380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--border-color)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '24px', width: '70%', backgroundColor: 'var(--border-color)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '18px', width: '40%', backgroundColor: 'var(--border-color)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
          <style>{`
            @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 0.3; }
              100% { opacity: 0.6; }
            }
          `}</style>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card text-center" style={{ padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <Tag size={40} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
          <h3>No se encontraron eventos</h3>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Prueba buscando otro término o regresa más tarde.</p>
        </div>
      ) : (
        /* Event Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {filteredEvents.map(e => (
            <Link key={e.id} to={`/event/${e.id}`} className="card card-glow" style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              height: '100%'
            }}>
              {/* Event Cover (Image / Placeholder) */}
              <div style={{
                height: '160px',
                backgroundImage: e.imageUrl ? `url(${e.imageUrl})` : `linear-gradient(135deg, ${e.category === 'Conciertos' ? '#4f46e5 0%, #7c3aed 100%' : '#0ea5e9 0%, #2563eb 100%'
                  })`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                display: 'flex',
                alignItems: 'end',
                padding: '1rem'
              }}>
                <span className="badge badge-info" style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  {e.category}
                </span>

                <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  ORGANIZADO POR TICKETGO
                </div>
              </div>

              {/* Event Content */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 0 }}>{e.title}</h3>

                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.5',
                  height: '2.5rem'
                }}>
                  {e.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{new Date(e.startDate).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{e.venue} ({e.city})</span>
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.75rem',
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span className={`badge ${e.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                    {e.status === 'Published' ? 'Venta Activa' : 'Borrador'}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9375rem' }}>
                    Comprar entradas &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
