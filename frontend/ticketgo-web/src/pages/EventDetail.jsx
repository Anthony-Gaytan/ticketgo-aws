import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, ShieldCheck, AlertCircle, ShoppingCart } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

export const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventData = await apiClient.get(`/api/Events/${id}`);
        setEvent(eventData);

        const typesData = await apiClient.get(`/api/EventTicketTypes/event/${id}`);
        setTicketTypes(typesData || []);
        if (typesData && typesData.length > 0) {
          setSelectedType(typesData[0].id);
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
        setError('Ocurrió un error al cargar la información del evento.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedType) return;

    setError('');
    setPurchasing(true);

    try {
      const result = await apiClient.post('/api/Orders/purchase', {
        eventTicketTypeId: selectedType,
        quantity: parseInt(quantity)
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al procesar la compra de entradas. Por favor, intente de nuevo.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <span>Cargando detalles del evento...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container text-center" style={{ padding: '5rem 0' }}>
        <h2>Evento no encontrado</h2>
        <a href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Volver al catálogo</a>
      </div>
    );
  }

  const selectedTicketInfo = ticketTypes.find(t => t.id === selectedType);
  const totalCost = selectedTicketInfo ? selectedTicketInfo.price * quantity : 0;

  return (
    <div className="container">
      {success ? (
        <div className="card text-center" style={{ maxWidth: '500px', margin: '3rem auto', padding: '3rem 2rem' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '1.25rem',
            borderRadius: '50%',
            color: 'var(--success)',
            display: 'inline-flex',
            marginBottom: '1.5rem'
          }}>
            <ShieldCheck size={48} />
          </div>
          <h2 style={{ fontWeight: 800 }}>¡Compra Realizada con Éxito!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
            Tus entradas se procesaron de forma asíncrona y tus códigos QR fueron generados correctamente. Puedes visualizarlos e imprimirlos desde tu cuenta.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem' }}>
            <Link to="/my-tickets" className="btn btn-primary" style={{ flex: 1 }}>
              Ver Mis Entradas
            </Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1 }}>
              Volver al Catálogo
            </Link>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: '2.5rem'
        }} className="event-detail-grid">
          
          {/* Left Column: Event Details */}
          <div>
            {/* Cover header */}
            <div style={{
              height: '300px',
              backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'end',
              padding: '2rem',
              marginBottom: '2rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)'
            }}>
              <span className="badge badge-info" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}>
                {event.category}
              </span>
              <div style={{ color: '#fff', zIndex: 10 }}>
                <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                  {event.title}
                </h1>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Calendar size={16} /> {new Date(event.startDate).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <MapPin size={16} /> {event.venue} ({event.city})
                  </span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>Sobre el evento</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9375rem' }}>
                {event.description}
              </p>
            </div>

            {/* Address Information */}
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>Ubicación y Recinto</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div><strong>Lugar:</strong> {event.venue}</div>
                <div><strong>Dirección:</strong> {event.address}</div>
                <div><strong>Ciudad:</strong> {event.city}</div>
                <div><strong>Aforo Total:</strong> {event.capacity} espectadores</div>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Ticket Purchasing Panel */}
          <div>
            <div className="card card-glow" style={{
              position: 'sticky',
              top: '90px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Selecciona tus Entradas
              </h3>

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

              {ticketTypes.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>
                  No hay tipos de entradas disponibles para este evento.
                </div>
              ) : (
                <form onSubmit={handlePurchase}>
                  {/* Select zone */}
                  <div className="form-group">
                    <label className="form-label">Zona / Ubicación</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {ticketTypes.map(t => {
                        const available = t.stock - t.soldQuantity;
                        const isSoldOut = available <= 0;

                        return (
                          <label key={t.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: `1px solid ${selectedType === t.id ? 'var(--primary)' : 'var(--border-color)'}`,
                            backgroundColor: selectedType === t.id ? 'rgba(99,102,241,0.05)' : 'var(--bg-app)',
                            cursor: isSoldOut ? 'not-allowed' : 'pointer',
                            opacity: isSoldOut ? 0.5 : 1
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="radio"
                                name="ticketType"
                                value={t.id}
                                checked={selectedType === t.id}
                                onChange={() => setSelectedType(t.id)}
                                disabled={isSoldOut}
                                style={{ accentColor: 'var(--primary)' }}
                              />
                              <div>
                                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{t.name}</span>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {isSoldOut ? 'Agotado' : `${available} disponibles`}
                                </div>
                              </div>
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              S/. {t.price.toFixed(2)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label" htmlFor="quantity">Cantidad</label>
                    <select
                      id="quantity"
                      className="form-input"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      disabled={!selectedType || selectedTicketInfo?.stock - selectedTicketInfo?.soldQuantity <= 0}
                    >
                      {[1, 2, 3, 4, 5, 6].map(q => (
                        <option key={q} value={q}>{q} {q === 1 ? 'entrada' : 'entradas'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Summary */}
                  <div style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '1rem',
                    borderRadius: '8px',
                    margin: '1.5rem 0',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Subtotal</span>
                      <span>S/. {totalCost.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      <span>Total</span>
                      <span>S/. {totalCost.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', height: '44px', gap: '0.5rem' }}
                    disabled={purchasing || !selectedType || selectedTicketInfo?.stock - selectedTicketInfo?.soldQuantity <= 0}
                  >
                    {purchasing ? (
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
                        <ShoppingCart size={18} /> {isAuthenticated ? 'Proceder al Pago' : 'Iniciar Sesión para Comprar'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      )}
      <style>{`
        @media (max-width: 900px) {
          .event-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
};
