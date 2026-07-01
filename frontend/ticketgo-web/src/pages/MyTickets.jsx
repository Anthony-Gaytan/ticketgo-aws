import { useEffect, useState } from 'react';
import { Calendar, MapPin, QrCode, Tag, Check, CalendarDays } from 'lucide-react';
import { apiClient } from '../api/apiClient';

export const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await apiClient.get('/api/Tickets/my-tickets');
        setTickets(data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  return (
    <div className="container">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Mis Entradas 🎫</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Aquí puedes ver todos tus pases adquiridos, descargar tus comprobantes y escanear tus códigos QR en el ingreso.
        </p>
      </div>

      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          color: 'var(--text-secondary)'
        }}>
          <span>Cargando tus entradas...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card text-center" style={{ padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <QrCode size={48} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
          <h3>Aún no tienes entradas</h3>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Explora nuestro catálogo de eventos y adquiere tus pases.
          </p>
          <a href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Explorar Eventos
          </a>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '2rem'
        }}>
          {tickets.map(ticket => (
            <div key={ticket.id} className="card" style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderLeft: '4px solid var(--primary)',
              boxShadow: 'var(--shadow-md)'
            }}>
              {/* Ticket Top */}
              <div style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-app)',
                borderBottom: '1px dashed var(--border-color)',
                position: 'relative'
              }}>
                {/* Decorative punched holes */}
                <div style={{ position: 'absolute', bottom: '-8px', left: '-8px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-app)', borderRight: '1px solid var(--border-color)', zIndex: 10 }} />
                <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-app)', borderLeft: '1px solid var(--border-color)', zIndex: 10 }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                    {ticket.ticketTypeName}
                  </span>
                  <span className={`badge ${
                    ticket.status === 'Used' ? 'badge-danger' : 'badge-success'
                  }`}>
                    {ticket.status === 'Used' ? 'Usado' : 'Disponible'}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {ticket.eventTitle}
                </h3>
              </div>

              {/* Ticket Info Area */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarDays size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Emitido el {new Date(ticket.issuedAt).toLocaleDateString('es-PE')}</span>
                  </div>
                  {ticket.usedAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                      <Check size={14} />
                      <span>Validado el {new Date(ticket.usedAt).toLocaleString('es-PE')}</span>
                    </div>
                  )}
                </div>

                <div style={{
                  backgroundColor: 'var(--bg-app)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Código de entrada:<br />
                    <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>
                      {ticket.code.toUpperCase()}
                    </strong>
                  </div>

                  <button
                    onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                    className="btn btn-primary"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    {selectedTicket === ticket.id ? 'Ocultar QR' : 'Ver QR'}
                  </button>
                </div>

                {/* Collapsible QR Section */}
                {selectedTicket === ticket.id && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem 0 0.5rem',
                    borderTop: '1px solid var(--border-color)',
                    animation: 'fadeIn var(--transition-fast) forwards',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      backgroundColor: '#fff',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      border: '1px solid var(--border-color)'
                    }}>
                      <img
                        src={ticket.qrCode}
                        alt="Código QR de Acceso"
                        style={{ width: '160px', height: '160px' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Presenta este QR al ingresar al recinto. No lo compartas con nadie.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
