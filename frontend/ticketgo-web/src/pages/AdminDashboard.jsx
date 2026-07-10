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
  Tag,
  Edit,
  Play,
  XCircle,
  Clock,
  Archive
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
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  // Form states (kept as strings for pure UX input handling without prepended zeros)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Conciertos',
    venue: '',
    address: '',
    city: '',
    startDate: '',
    endDate: '',
    capacity: '100',
    status: 'Draft'
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [formTicketTypes, setFormTicketTypes] = useState([
    { name: 'General', price: '50.00', stock: '100' }
  ]);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setGlobalError('');
    setForbiddenError({ users: false, orders: false, tickets: false });

    try {
      const eventsData = await apiClient.get('/api/Events');
      setEventsList(eventsData || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setGlobalError('Error al conectar con la API de eventos.');
    }

    try {
      const usersData = await apiClient.get('/api/Users');
      setUsersList(usersData || []);
    } catch (err) {
      console.warn('Users access denied:', err);
      setForbiddenError(prev => ({ ...prev, users: true }));
    }

    try {
      const ordersData = await apiClient.get('/api/Orders');
      setOrdersList(ordersData || []);
    } catch (err) {
      console.warn('Orders access denied:', err);
      setForbiddenError(prev => ({ ...prev, orders: true }));
    }

    try {
      const ticketsData = await apiClient.get('/api/Tickets');
      setTicketsList(ticketsData || []);
    } catch (err) {
      console.warn('Tickets access denied:', err);
      setForbiddenError(prev => ({ ...prev, tickets: true }));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Helper formatting states
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Published': return 'badge-success';
      case 'PendingReview': return 'badge-warning';
      case 'OnHold': return 'badge-info';
      case 'Rejected':
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-secondary'; // Draft
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Published': return 'Publicado';
      case 'PendingReview': return 'En Revisión';
      case 'OnHold': return 'En Espera';
      case 'Rejected': return 'Rechazado';
      case 'Cancelled': return 'Cancelado';
      default: return 'Borrador';
    }
  };

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
    setFormTicketTypes([...formTicketTypes, { name: '', price: '', stock: '' }]);
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
          [field]: value
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
      console.error('Error fetching ticket types:', err);
    }
  };

  // Admin action: publish/approve event
  const handlePublishEvent = async (eventId) => {
    if (!window.confirm('¿Estás seguro de que deseas APROBAR y PUBLICAR este evento?')) return;
    try {
      await apiClient.patch(`/api/Events/${eventId}/publish`);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al publicar el evento.');
    }
  };

  // Admin action: reject event
  const handleRejectEvent = async (eventItem) => {
    if (!window.confirm('¿Estás seguro de que deseas RECHAZAR este evento?')) return;
    try {
      await apiClient.put(`/api/Events/${eventItem.id}`, {
        title: eventItem.title,
        description: eventItem.description,
        category: eventItem.category,
        venue: eventItem.venue,
        address: eventItem.address,
        city: eventItem.city,
        startDate: eventItem.startDate,
        endDate: eventItem.endDate,
        capacity: eventItem.capacity,
        imageUrl: eventItem.imageUrl,
        status: 'Rejected'
      });
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al rechazar el evento.');
    }
  };

  // Admin action: hold event
  const handleHoldEvent = async (eventItem) => {
    if (!window.confirm('¿Estás seguro de que deseas poner este evento EN ESPERA?')) return;
    try {
      await apiClient.put(`/api/Events/${eventItem.id}`, {
        title: eventItem.title,
        description: eventItem.description,
        category: eventItem.category,
        venue: eventItem.venue,
        address: eventItem.address,
        city: eventItem.city,
        startDate: eventItem.startDate,
        endDate: eventItem.endDate,
        capacity: eventItem.capacity,
        imageUrl: eventItem.imageUrl,
        status: 'OnHold'
      });
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al poner en espera el evento.');
    }
  };

  // Admin/Organizer action: cancel event
  const handleCancelEvent = async (eventId) => {
    if (!window.confirm('¿Estás seguro de que deseas CANCELAR este evento?')) return;
    try {
      await apiClient.patch(`/api/Events/${eventId}/cancel`);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al cancelar el evento.');
    }
  };

  // Admin action: delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('¿Estás seguro de que deseas ELIMINAR permanentemente este evento del catálogo?')) return;
    try {
      await apiClient.delete(`/api/Events/${eventId}`);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al eliminar el evento.');
    }
  };

  // Open edit modal for an event
  const openEditEvent = async (eventItem) => {
    setIsEditing(true);
    setEditingEventId(eventItem.id);
    
    // Format local datetime strings for inputs (YYYY-MM-DDThh:mm)
    const formatDateTimeLocal = (dateStr) => {
      const d = new Date(dateStr);
      const pad = (n) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setFormData({
      title: eventItem.title,
      description: eventItem.description,
      category: eventItem.category,
      venue: eventItem.venue,
      address: eventItem.address,
      city: eventItem.city,
      startDate: formatDateTimeLocal(eventItem.startDate),
      endDate: formatDateTimeLocal(eventItem.endDate),
      capacity: eventItem.capacity.toString(),
      status: eventItem.status
    });

    setImagePreview(eventItem.imageUrl);

    // Fetch existing zones
    try {
      const typesData = await apiClient.get(`/api/EventTicketTypes/event/${eventItem.id}`);
      if (typesData && typesData.length > 0) {
        setFormTicketTypes(typesData.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price.toString(),
          stock: t.stock.toString()
        })));
      } else {
        setFormTicketTypes([{ name: 'General', price: '50.00', stock: '100' }]);
      }
    } catch (err) {
      console.error('Error fetching ticket types for edit:', err);
      setFormTicketTypes([{ name: 'General', price: '50.00', stock: '100' }]);
    }

    setCreateModalOpen(true);
  };

  // Handle Submit Form (either Create or Update)
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    const capacityVal = parseInt(formData.capacity) || 0;
    if (capacityVal <= 0) {
      setFormError('La capacidad del evento debe ser mayor a cero.');
      setFormSubmitting(false);
      return;
    }

    // Validate dates
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setFormError('La fecha de inicio debe ser anterior a la fecha de finalización.');
      setFormSubmitting(false);
      return;
    }

    // Validate individual ticket type stocks and prices
    for (let i = 0; i < formTicketTypes.length; i++) {
      const type = formTicketTypes[i];
      if (!type.name.trim()) {
        setFormError(`El nombre de la zona ${i + 1} no puede estar vacío.`);
        setFormSubmitting(false);
        return;
      }
      const priceVal = parseFloat(type.price);
      if (isNaN(priceVal) || priceVal < 0) {
        setFormError(`El precio de la zona "${type.name || (i + 1)}" debe ser mayor o igual a cero.`);
        setFormSubmitting(false);
        return;
      }
      const stockVal = parseInt(type.stock) || 0;
      if (stockVal <= 0) {
        setFormError(`El stock de la zona "${type.name || (i + 1)}" debe ser mayor a cero.`);
        setFormSubmitting(false);
        return;
      }
    }

    // Validate stock sum does not exceed capacity
    const totalTicketStock = formTicketTypes.reduce((acc, curr) => acc + (parseInt(curr.stock) || 0), 0);
    if (totalTicketStock > capacityVal) {
      setFormError(`La suma del stock de las zonas (${totalTicketStock}) no puede superar la capacidad del evento (${capacityVal}).`);
      setFormSubmitting(false);
      return;
    }

    try {
      if (isEditing) {
        // Edit Mode: PUT basic event info
        await apiClient.put(`/api/Events/${editingEventId}`, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          venue: formData.venue,
          address: formData.address,
          city: formData.city,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          capacity: capacityVal,
          status: formData.status,
          imageUrl: imagePreview
        });

        // Edit/Create event ticket zones
        for (const type of formTicketTypes) {
          if (type.id) {
            // Update existing ticket type
            await apiClient.put(`/api/EventTicketTypes/${type.id}`, {
              name: type.name,
              price: parseFloat(type.price),
              stock: parseInt(type.stock),
              isActive: true
            });
          } else {
            // Create new ticket type
            await apiClient.post('/api/EventTicketTypes', {
              eventId: editingEventId,
              name: type.name,
              price: parseFloat(type.price),
              stock: parseInt(type.stock)
            });
          }
        }
      } else {
        // Create Mode: POST new event
        const newEvent = await apiClient.post('/api/Events', {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          venue: formData.venue,
          address: formData.address,
          city: formData.city,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          capacity: capacityVal,
          status: formData.status,
          imageUrl: imagePreview
        });

        // POST all zones
        if (newEvent && newEvent.id) {
          for (const type of formTicketTypes) {
            await apiClient.post('/api/EventTicketTypes', {
              eventId: newEvent.id,
              name: type.name,
              price: parseFloat(type.price),
              stock: parseInt(type.stock)
            });
          }
        }
      }

      setFormSuccess(true);
      setTimeout(() => {
        setCreateModalOpen(false);
        setFormSuccess(false);
        setIsEditing(false);
        setEditingEventId(null);
        loadDashboardData();
      }, 1500);

    } catch (err) {
      console.error('Error saving event:', err);
      setFormError(err.message || 'Error en la API al procesar la solicitud.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Metric helpers
  const totalEventsCount = eventsList.length;
  const publishedEventsCount = eventsList.filter(e => e.status === 'Published').length;
  const totalCapacityStock = eventsList.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalSoldStock = eventsList.reduce((acc, curr) => acc + curr.ticketsSold, 0);
  
  const totalOrdersCount = forbiddenError.orders ? 'N/A (Admin)' : ordersList.length;
  const totalUsersCount = forbiddenError.users ? 'N/A (Admin)' : usersList.length;
  const totalTicketsSoldFromTickets = forbiddenError.tickets ? totalSoldStock : ticketsList.length;
  const estimatedRevenue = forbiddenError.orders 
    ? 'N/A (Admin)' 
    : ordersList.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="container">
      {/* Dashboard Top Navigation Banner */}
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
            Sesión: <strong style={{ color: 'var(--text-primary)' }}>{user?.fullName}</strong> ({user?.role}). Gestiona tu catálogo y aprueba eventos.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setIsEditing(false);
          setEditingEventId(null);
          setFormData({
            title: '',
            description: '',
            category: 'Conciertos',
            venue: '',
            address: '',
            city: '',
            startDate: '',
            endDate: '',
            capacity: '100',
            status: user?.role === 'Organizer' ? 'PendingReview' : 'Draft'
          });
          setImagePreview(null);
          setFormTicketTypes([{ name: 'General', price: '50.00', stock: '100' }]);
          setFormError('');
          setCreateModalOpen(true);
        }}>
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
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
              }}>
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

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '0.875rem', borderRadius: '10px', display: 'flex' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TICKETS VENDIDOS</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{totalTicketsSoldFromTickets}</h3>
                  </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ backgroundColor: 'rgba(14,165,233,0.1)', color: 'var(--info)', padding: '0.875rem', borderRadius: '10px', display: 'flex' }}>
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL ÓRDENES</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{totalOrdersCount}</h3>
                  </div>
                </div>

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

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
              }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CATÁLOGO DE EVENTOS</span>
                    <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{totalEventsCount}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {publishedEventsCount} publicados | {totalEventsCount - publishedEventsCount} borradores/pendientes
                  </div>
                </div>

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
              <div style={{ padding: '0 1.5rem 1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Gestión de Catálogo</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {user?.role === 'Admin' 
                    ? 'Monitorea, aprueba y administra el catálogo de eventos del sistema.'
                    : 'Administra tus eventos creados y visualiza su estado de revisión.'
                  }
                </p>
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
                      {eventsList
                        .filter(e => user?.role === 'Admin' || e.organizerId === user?.id)
                        .map(e => {
                          const percent = e.capacity > 0 ? ((e.ticketsSold / e.capacity) * 100).toFixed(1) : 0;
                          const formattedDate = new Date(e.startDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
                          const isPublished = e.status === 'Published';

                          return (
                            <tr key={e.id}>
                              <td style={{ fontWeight: 700 }}>{e.title}</td>
                              <td>
                                <span className="badge badge-info">{e.category}</span>
                              </td>
                              <td>{e.city}</td>
                              <td>{formattedDate}</td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(e.status)}`}>
                                  {getStatusLabel(e.status)}
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
                                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                  <button 
                                    onClick={() => openEventDetails(e)}
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                                    title="Ver Detalles"
                                  >
                                    <Eye size={12} />
                                  </button>

                                  {/* Organizer Action: Edit only if editable */}
                                  {user?.role === 'Organizer' && (
                                    <button 
                                      onClick={() => openEditEvent(e)}
                                      className="btn btn-secondary" 
                                      style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                                      disabled={!e.canEdit}
                                      title={!e.canEdit ? "No se puede editar este evento en su estado actual" : "Editar Evento"}
                                    >
                                      <Edit size={12} />
                                    </button>
                                  )}

                                  {/* Organizer Action: Cancel if published and cancelable */}
                                  {user?.role === 'Organizer' && isPublished && (
                                    <button 
                                      onClick={() => handleCancelEvent(e.id)}
                                      className="btn btn-danger" 
                                      style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem', color: '#fff', border: 'none' }}
                                      disabled={!e.canCancel}
                                      title={!e.canCancel ? "No disponible porque el evento ya tiene ventas." : "Cancelar Evento"}
                                    >
                                      <XCircle size={12} />
                                    </button>
                                  )}

                                  {/* Admin Actions */}
                                  {user?.role === 'Admin' && (
                                    <>
                                      <button 
                                        onClick={() => openEditEvent(e)}
                                        className="btn btn-secondary" 
                                        style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem' }}
                                        disabled={!e.canEdit}
                                        title={!e.canEdit ? "No se puede editar este evento en su estado actual" : "Editar Evento"}
                                      >
                                        <Edit size={12} />
                                      </button>

                                      {!isPublished && e.status !== 'Cancelled' && (
                                        <button 
                                          onClick={() => handlePublishEvent(e.id)}
                                          className="btn btn-primary" 
                                          style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                                          disabled={!e.canPublish}
                                          title={!e.canPublish ? "No disponible en este estado" : "Aprobar y Publicar"}
                                        >
                                          <Play size={12} />
                                        </button>
                                      )}

                                      {e.status === 'PendingReview' && (
                                        <button 
                                          onClick={() => handleRejectEvent(e)}
                                          className="btn btn-danger" 
                                          style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', color: '#fff', border: 'none' }}
                                          title="Rechazar Evento"
                                        >
                                          <XCircle size={12} />
                                        </button>
                                      )}

                                      {e.status !== 'OnHold' && !isPublished && e.status !== 'Cancelled' && e.status !== 'Rejected' && (
                                        <button 
                                          onClick={() => handleHoldEvent(e)}
                                          className="btn btn-secondary" 
                                          style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem' }}
                                          title="Poner en Espera"
                                        >
                                          <Clock size={12} />
                                        </button>
                                      )}

                                      {e.status !== 'Cancelled' && (
                                        <button 
                                          onClick={() => handleCancelEvent(e.id)}
                                          className="btn btn-danger" 
                                          style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', color: '#fff', border: 'none', backgroundColor: '#e11d48' }}
                                          disabled={!e.canCancel}
                                          title={!e.canCancel ? "No disponible porque el evento ya tiene ventas." : "Cancelar Evento"}
                                        >
                                          <Archive size={12} />
                                        </button>
                                      )}

                                      <button 
                                        onClick={() => handleDeleteEvent(e.id)}
                                        className="btn btn-danger" 
                                        style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', color: '#fff', border: 'none' }}
                                        disabled={!e.canDelete}
                                        title={!e.canDelete ? "No disponible porque el evento ya tiene ventas." : "Eliminar Evento"}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </>
                                  )}
                                </div>
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
                        {usersList.map(u => (
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL: CREAR / EDITAR EVENTO */}
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
              onClick={() => {
                setCreateModalOpen(false);
                setIsEditing(false);
                setEditingEventId(null);
              }}
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
                <h3>{isEditing ? '¡Evento Actualizado con Éxito!' : '¡Evento Creado con Éxito!'}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Los datos del evento fueron registrados correctamente en base de datos.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveEvent}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                  {isEditing ? 'Editar Evento' : 'Crear Nuevo Evento'}
                </h3>

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

                {/* Info contextual por rol */}
                {user?.role === 'Organizer' && !isEditing && (
                  <div style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    borderLeft: '4px solid var(--warning)',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1.25rem'
                  }}>
                    <strong>Nota:</strong> Como Organizador, tu evento se creará automáticamente en estado <strong>En Revisión</strong>. El Administrador deberá auditarlo antes de que aparezca listado en la cartelera principal.
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

                {/* Dynamic Inputs grid for dates, capacity & status */}
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
                      type="text" 
                      className="form-input"
                      value={formData.capacity}
                      onChange={e => {
                        const val = e.target.value;
                        // Regex prevents typing non-digits and zero at start
                        if (val === '' || /^[1-9][0-9]*$/.test(val)) {
                          setFormData({ ...formData, capacity: val });
                        }
                      }}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select 
                      className="form-input"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      disabled={user?.role === 'Organizer'}
                    >
                      {user?.role === 'Organizer' ? (
                        <>
                          <option value="PendingReview">En Revisión</option>
                          <option value="Draft">Borrador</option>
                        </>
                      ) : (
                        <>
                          <option value="Draft">Draft (Borrador)</option>
                          <option value="PendingReview">PendingReview (Revisión)</option>
                          <option value="Published">Published (Publicado)</option>
                          <option value="OnHold">OnHold (Espera)</option>
                          <option value="Rejected">Rejected (Rechazado)</option>
                          <option value="Cancelled">Cancelled (Cancelado)</option>
                        </>
                      )}
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

                {/* Section 2: Ticket Zones list */}
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
                          type="text" 
                          className="form-input" 
                          placeholder="0.00"
                          value={type.price}
                          onChange={e => {
                            const val = e.target.value;
                            // Regex supports decimals up to 2 decimal places cleanly
                            if (val === '' || /^[0-9]*\.?[0-9]{0,2}$/.test(val)) {
                              updateFormTicketType(idx, 'price', val);
                            }
                          }}
                          required 
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        {idx === 0 && <label className="form-label">Stock</label>}
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="0"
                          value={type.stock}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^[1-9][0-9]*$/.test(val)) {
                              updateFormTicketType(idx, 'stock', val);
                            }
                          }}
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

                {/* Submit / Cancel Actions */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setCreateModalOpen(false);
                      setIsEditing(false);
                      setEditingEventId(null);
                    }}
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
                    ) : (isEditing ? 'Guardar Cambios' : 'Registrar Evento')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EVENT DETAILS */}
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
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span className="badge badge-info">{selectedEventForDetail.category}</span>
              <span className={`badge ${getStatusBadgeClass(selectedEventForDetail.status)}`}>
                {getStatusLabel(selectedEventForDetail.status)}
              </span>
            </div>

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

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Detalle de Zonas</h4>
              
              {selectedEventTicketTypes.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem', padding: '1rem' }}>
                  Cargando zonas de entradas...
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

      {/* Custom layout CSS media query rules */}
      <style>{`
        @media (max-width: 768px) {
          .event-form-grid, .event-form-grid-3, .event-form-grid-4 {
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
