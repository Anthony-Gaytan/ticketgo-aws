import { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  BarChart3, 
  AlertCircle, 
  Plus, 
  Eye, 
  TrendingUp, 
  Coins, 
  Trash2, 
  Image as ImageIcon, 
  Lock, 
  Percent, 
  PlusCircle, 
  CheckCircle2,
  Tag
} from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('metrics'); // metrics | events | users
  
  // Data lists
  const [usersList, setUsersList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [ticketsList, setTicketsList] = useState([]);
  
  // Loaders and errors
  const [loading, setLoading] = useState(true);
  const [forbiddenError, setForbiddenError] = useState({ users: false, orders: false, tickets: false });
  const [globalError, setGlobalError] = useState('');
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);
  const [selectedEventTicketTypes, setSelectedEventTicketTypes] = useState([]);

  // Form states for creating event
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Conciertos',
    venue: '',
    address: '',
    city: '',
    startDate: '',
    endDate: '',
    capacity: 100,
    status: 'Draft'
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [formTicketTypes, setFormTicketTypes] = useState([
    { name: 'General', price: 50.00, stock: 100 }
  ]);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setGlobalError('');
    setForbiddenError({ users: false, orders: false, tickets: false });

    // Events are public, anyone (Admin/Organizer) can load them
    try {
      const eventsData = await apiClient.get('/api/Events');
      setEventsList(eventsData || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setGlobalError('Error al conectar con la API de eventos.');
    }

    // Admin-only endpoints. If Organizer, catch 403/401 and set local forbidden status
    try {
      const usersData = await apiClient.get('/api/Users');
      setUsersList(usersData || []);
    } catch (err) {
      console.warn('Users access denied (typical for Organizer):', err);
      setForbiddenError(prev => ({ ...prev, users: true }));
    }

    try {
      const ordersData = await apiClient.get('/api/Orders');
      setOrdersList(ordersData || []);
    } catch (err) {
      console.warn('Orders access denied (typical for Organizer):', err);
      setForbiddenError(prev => ({ ...prev, orders: true }));
    }

    try {
      const ticketsData = await apiClient.get('/api/Tickets');
      setTicketsList(ticketsData || []);
    } catch (err) {
      console.warn('Tickets access denied (typical for Organizer):', err);
      setForbiddenError(prev => ({ ...prev, tickets: true }));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // FileReader local preview handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamic ticket type actions
  const addFormTicketType = () => {
    setFormTicketTypes([...formTicketTypes, { name: '', price: 0.00, stock: 0 }]);
  };

  const removeFormTicketType = (index) => {
    const updated = formTicketTypes.filter((_, i) => i !== index);
    setFormTicketTypes(updated);
  };

  const updateFormTicketType = (index, field, value) => {
    const updated = formTicketTypes.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [field]: field === 'price' || field === 'stock' ? parseFloat(value) || 0 : value
        };
      }
      return item;
    });
    setFormTicketTypes(updated);
  };

  // Open specific event administrative details modal
  const openEventDetails = async (eventItem) => {
    setSelectedEventForDetail(eventItem);
    setDetailModalOpen(true);
    try {
      const typesData = await apiClient.get(`/api/EventTicketTypes/event/${eventItem.id}`);
      setSelectedEventTicketTypes(typesData || []);
    } catch (err) {
      console.error('Error fetching ticket types for detail view:', err);
    }
  };

  // Submit new event creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    // Validate date order
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setFormError('La fecha de inicio debe ser anterior a la fecha de finalización.');
      setFormSubmitting(false);
      return;
    }

    // Validate stock sum does not exceed event capacity
    const totalTicketStock = formTicketTypes.reduce((acc, curr) => acc + curr.stock, 0);
    if (totalTicketStock > formData.capacity) {
      setFormError(`La suma de stocks de las zonas (${totalTicketStock}) excede la capacidad total del evento (${formData.capacity}).`);
      setFormSubmitting(false);
      return;
    }

    try {
      // Step 1: Create Event
      const newEvent = await apiClient.post('/api/Events', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        venue: formData.venue,
        address: formData.address,
        city: formData.city,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        capacity: parseInt(formData.capacity),
        status: formData.status,
        imageUrl: imagePreview
      });

      // Step 2: Create ticket types sequentially
      if (newEvent && newEvent.id) {
        for (const type of formTicketTypes) {
          await apiClient.post('/api/EventTicketTypes', {
            eventId: newEvent.id,
            name: type.name,
            price: type.price,
            stock: type.stock
          });
        }
      }

      setFormSuccess(true);
      setTimeout(() => {
        setCreateModalOpen(false);
        setFormSuccess(false);
        // Reset forms
        setFormData({
          title: '',
          description: '',
          category: 'Conciertos',
          venue: '',
          address: '',
          city: '',
          startDate: '',
          endDate: '',
          capacity: 100,
          status: 'Draft'
        });
        setImagePreview(null);
        setFormTicketTypes([{ name: 'General', price: 50.00, stock: 100 }]);
        loadDashboardData(); // Refresh list
      }, 2000);

    } catch (err) {
      console.error('Error creating event or ticket types:', err);
      setFormError(err.message || 'Error en la API al registrar el evento.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Math metrics helper
  const totalEventsCount = eventsList.length;
  const publishedEventsCount = eventsList.filter(e => e.status === 'Published').length;
  const totalCapacityStock = eventsList.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalSoldStock = eventsList.reduce((acc, curr) => acc + curr.ticketsSold, 0);
  
  // Admin-only metric fallback calculations
  const totalOrdersCount = forbiddenError.orders ? 'N/A (Admin)' : ordersList.length;
  const totalUsersCount = forbiddenError.users ? 'N/A (Admin)' : usersList.length;
  const totalTicketsSoldFromTickets = forbiddenError.tickets ? totalSoldStock : ticketsList.length;
  const estimatedRevenue = forbiddenError.orders 
    ? 'N/A (Admin)' 
    : ordersList.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="container">
      {/* Top Banner Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Panel de Control 🛠️</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Bienvenido, <strong style={{ color: 'var(--text-primary)' }}>{user?.fullName}</strong> ({user?.role}). Gestiona tu catálogo y monitorea ventas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} /> Crear Nuevo Evento
        </button>
      </div>

      {/* Tabs Menu Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.75rem',
        marginBottom: '2rem',
        overflowX: 'auto'
      }}>
        <button 
          onClick={() => setActiveTab('metrics')}
          className={`btn ${activeTab === 'metrics' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
        >
          <BarChart3 size={14} /> Resumen y Métricas
        </button>
        <button 
          onClick={() => setActiveTab('events')}
          className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
        >
          <Calendar size={14} /> Catálogo de Eventos
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
        >
          <Users size={14} /> Control de Usuarios
        </button>
      </div>

      {globalError && (
        <div style={{
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          color: 'var(--danger)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}>
          <AlertCircle size={18} />
          <span>{globalError}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <span>Cargando información del panel...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: METRICS */}
          {activeTab === 'metrics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Grid 1: Sales and Global Numbers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Metric Card: Estimated Revenue */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.875rem', borderRadius: '10px', display: 'flex' }}>
                    <Coins size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>INGRESOS ESTIMADOS</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                      {typeof estimatedRevenue === 'number' ? `S/. ${estimatedRevenue.toFixed(2)}` : estimatedRevenue}
                    </h3>
                  </div>
                </div>

                {/* Metric Card: Tickets Sold */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '0.875rem', borderRadius: '10px', display: 'flex' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TICKETS VENDIDOS</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{totalTicketsSoldFromTickets}</h3>
                  </div>
                </div>

                {/* Metric Card: Orders */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ backgroundColor: 'rgba(14,165,233,0.1)', color: 'var(--info)', padding: '0.875rem', borderRadius: '10px', display: 'flex' }}>
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL ÓRDENES</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{totalOrdersCount}</h3>
                  </div>
                </div>

                {/* Metric Card: Users */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: 'var(--accent)', padding: '0.875rem', borderRadius: '10px', display: 'flex' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL USUARIOS</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{totalUsersCount}</h3>
                  </div>
                </div>
              </div>

              {/* Grid 2: Catalog Stats & Stocks */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Metric Card: Total Events */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CATÁLOGO DE EVENTOS</span>
                    <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{totalEventsCount}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {publishedEventsCount} publicados | {totalEventsCount - publishedEventsCount} borradores
                  </div>
                </div>

                {/* Metric Card: Stock Capacity */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CAPACIDAD TOTAL AFORO</span>
                    <Percent size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{totalCapacityStock}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {totalSoldStock} vendidos | {totalCapacityStock - totalSoldStock} libres
                  </div>
                </div>

                {/* Metric Card: Sales progress percentage */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PORCENTAJE VENDIDO GLOBAL</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
                      {totalCapacityStock > 0 ? ((totalSoldStock / totalCapacityStock) * 100).toFixed(1) : 0}%
                    </h3>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginTop: '0.25rem' }}>
                    <div style={{
                      height: '100%',
                      width: `${totalCapacityStock > 0 ? (totalSoldStock / totalCapacityStock) * 100 : 0}%`,
                      backgroundColor: 'var(--primary)',
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              </div>

              {/* Forbidden / Restricted Alerts for Organizer */}
              {(forbiddenError.users || forbiddenError.orders) && (
                <div className="card" style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem',
                  padding: '1.25rem'
                }}>
                  <Lock size={20} style={{ color: 'var(--warning)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Acceso Restringido a Métricas Administrativas
                    </h4>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Como tu cuenta tiene el rol <strong>{user?.role}</strong>, no cuentas con permisos para jalar la lista de usuarios, órdenes o ingresos estimados globales de AWS. Sin embargo, puedes gestionar tus eventos sin restricciones en las otras pestañas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EVENTS CATALOG */}
          {activeTab === 'events' && (
            <div className="card" style={{ padding: '1.5rem 0' }}>
              <div style={{ padding: '0 1.5rem 1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Gestión de Catálogo</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Monitorea la capacidad, ventas y el estado de publicación de cada evento.
                  </p>
                </div>
              </div>

              <div style={{ padding: '0 1.5rem' }}>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Ciudad</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Vendido</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventsList.map(e => {
                        const percent = e.capacity > 0 ? ((e.ticketsSold / e.capacity) * 100).toFixed(1) : 0;
                        const formattedDate = new Date(e.startDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });

                        return (
                          <tr key={e.id}>
                            <td style={{ fontWeight: 700 }}>{e.title}</td>
                            <td>
                              <span className="badge badge-info">{e.category}</span>
                            </td>
                            <td>{e.city}</td>
                            <td>{formattedDate}</td>
                            <td>
                              <span className={`badge ${e.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                                {e.status === 'Published' ? 'Publicado' : 'Borrador'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '100px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                  {e.ticketsSold} / {e.capacity} ({percent}%)
                                </span>
                                <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${percent}%`,
                                    backgroundColor: 'var(--success)',
                                    borderRadius: '3px'
                                  }} />
                                </div>
                              </div>
                            </td>
                            <td>
                              <button 
                                onClick={() => openEventDetails(e)}
                                className="btn btn-secondary" 
                                style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', gap: '0.25rem' }}
                              >
                                <Eye size={12} /> Detalles
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {eventsList.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No hay eventos registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USERS LIST */}
          {activeTab === 'users' && (
            <div className="card" style={{ padding: '1.5rem 0' }}>
              <div style={{ padding: '0 1.5rem 1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Control de Usuarios</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Listado global de cuentas de clientes, organizadores y administradores registradas en AWS.
                </p>
              </div>

              {forbiddenError.users ? (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Lock size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                  <h3>Acceso Denegado</h3>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Solo los Administradores de la plataforma pueden cargar el listado general de usuarios de AWS.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '0 1.5rem' }}>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Nombre completo</th>
                          <th>Correo electrónico</th>
                          <th>Rol</th>
                          <th>Fecha de registro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map(u => {
                          return (
                            <tr key={u.id}>
                              <td style={{ fontWeight: 700 }}>{u.fullName}</td>
                              <td>{u.email}</td>
                              <td>
                                <span className={`badge ${
                                  u.role === 'Admin' 
                                    ? 'badge-danger' 
                                    : u.role === 'Organizer' 
                                      ? 'badge-warning' 
                                      : 'badge-success'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td>{new Date(u.createdAt).toLocaleDateString('es-PE')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: CREAR EVENTO */}
      {createModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card" style={{
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2.5rem 2rem',
            position: 'relative'
          }}>
            <button 
              onClick={() => setCreateModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>

            {formSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  color: 'var(--success)',
                  padding: '1rem',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  marginBottom: '1rem'
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <h3>¡Evento Creado con Éxito!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  El evento y sus correspondientes zonas de entradas fueron registrados exitosamente en AWS.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateEvent}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.25rem' }}>Crear Nuevo Evento</h3>

                {formError && (
                  <div style={{
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    color: 'var(--danger)',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    marginBottom: '1.25rem'
                  }}>
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Basic details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="event-form-grid">
                  <div className="form-group">
                    <label className="form-label">Nombre del Evento</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Concierto Rock"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select 
                      className="form-input"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Conciertos">Conciertos</option>
                      <option value="Deportes">Deportes</option>
                      <option value="Festivales">Festivales</option>
                      <option value="Teatro">Teatro</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    placeholder="Escribe los detalles e información importante del evento..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    style={{ resize: 'vertical' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }} className="event-form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Recinto / Lugar</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Estadio Nacional"
                      value={formData.venue}
                      onChange={e => setFormData({ ...formData, venue: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dirección</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Av. Javier Prado"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ciudad</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Lima"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }} className="event-form-grid-4">
                  <div className="form-group">
                    <label className="form-label">Fecha Inicio</label>
                    <input 
                      type="datetime-local" 
                      className="form-input"
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha Fin</label>
                    <input 
                      type="datetime-local" 
                      className="form-input"
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capacidad</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                      min="1"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select 
                      className="form-input"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                </div>

                {/* Local image file preview block */}
                <div style={{
                  border: '1px dashed var(--border-color)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-app)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ImageIcon size={14} /> Imagen del Evento (Solo local preview)
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      style={{ fontSize: '0.8125rem', marginTop: '0.375rem' }} 
                    />
                  </div>
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Local Preview" 
                      style={{ width: '80px', height: '80px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                    />
                  )}
                </div>

                {/* Section 2: Ticket Types list */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Zonas y Precios de Entradas</h4>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={addFormTicketType}
                      style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', gap: '0.25rem' }}
                    >
                      <PlusCircle size={12} /> Añadir Zona
                    </button>
                  </div>

                  {formTicketTypes.map((type, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'end',
                      marginBottom: '0.75rem'
                    }}>
                      <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                        {idx === 0 && <label className="form-label">Nombre Zona</label>}
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="VIP, General, etc."
                          value={type.name}
                          onChange={e => updateFormTicketType(idx, 'name', e.target.value)}
                          required 
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        {idx === 0 && <label className="form-label">Precio (S/.)</label>}
                        <input 
                          type="number" 
                          step="0.01"
                          className="form-input" 
                          placeholder="0.00"
                          value={type.price}
                          onChange={e => updateFormTicketType(idx, 'price', e.target.value)}
                          required 
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        {idx === 0 && <label className="form-label">Stock</label>}
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="0"
                          value={type.stock}
                          onChange={e => updateFormTicketType(idx, 'stock', e.target.value)}
                          required 
                        />
                      </div>
                      {formTicketTypes.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-danger"
                          onClick={() => removeFormTicketType(idx)}
                          style={{ padding: '0.625rem', borderRadius: '8px', color: '#fff', border: 'none' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action button */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setCreateModalOpen(false)}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 1, height: '42px' }}
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    ) : 'Guardar y Publicar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: EVENT DETAILS */}
      {detailModalOpen && selectedEventForDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card" style={{
            maxWidth: '600px',
            width: '100%',
            padding: '2rem',
            position: 'relative'
          }}>
            <button 
              onClick={() => setDetailModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {selectedEventForDetail.title}
            </h3>
            <span className="badge badge-info" style={{ marginBottom: '1.5rem' }}>
              {selectedEventForDetail.category}
            </span>

            {/* Performance status metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>VENDIDO</span>
                <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>{selectedEventForDetail.ticketsSold}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>RESTANTE</span>
                <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>
                  {selectedEventForDetail.capacity - selectedEventForDetail.ticketsSold}
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>% VENTAS</span>
                <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>
                  {selectedEventForDetail.capacity > 0 
                    ? ((selectedEventForDetail.ticketsSold / selectedEventForDetail.capacity) * 100).toFixed(1) 
                    : 0}%
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <span>Progreso de ventas</span>
                <span>
                  {selectedEventForDetail.capacity > 0 
                    ? ((selectedEventForDetail.ticketsSold / selectedEventForDetail.capacity) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${selectedEventForDetail.capacity > 0 ? (selectedEventForDetail.ticketsSold / selectedEventForDetail.capacity) * 100 : 0}%`,
                  backgroundColor: 'var(--primary)',
                  borderRadius: '4px'
                }} />
              </div>
            </div>

            {/* Ticket types breakdown */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Detalle de Zonas</h4>
              
              {selectedEventTicketTypes.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem', padding: '1rem' }}>
                  Cargando información de zonas...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedEventTicketTypes.map(t => {
                    const rev = t.soldQuantity * t.price;
                    return (
                      <div key={t.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>{t.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Precio: S/. {t.price.toFixed(2)} | Stock: {t.stock} | Vendidos: {t.soldQuantity}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                            S/. {rev.toFixed(2)}
                          </div>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Est. Ingresos</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={() => setDetailModalOpen(false)}
              style={{ width: '100%', marginTop: '2rem' }}
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}

      {/* Custom Styles overrides */}
      <style>{`
        @media (max-width: 768px) {
          .event-form-grid, .event-form-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
