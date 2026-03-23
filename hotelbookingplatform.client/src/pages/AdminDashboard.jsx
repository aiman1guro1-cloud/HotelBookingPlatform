import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Hotel, Bed, BookOpen, TrendingUp, PlusCircle, Trash2, Edit3,
    Eye, ChevronRight, LayoutDashboard, Users, LogOut, X, Save,
    CheckCircle, ShieldAlert, Zap, Layers, Grid, Upload, Image as ImageIcon
} from 'lucide-react';
import { getAllBookings } from '../services/bookingService';
import { getHotels, createHotel, updateHotel, deleteHotel, deleteAllHotels, deleteNonAdminHotels, getAmenities, uploadHotelImage } from '../services/hotelService';
import useAuthStore from '../stores/useAuthStore';
import './AdminDashboard.css';

const STATUS_COLORS = {
    Confirmed: 'status-confirmed', Pending: 'status-pending',
    Completed: 'status-completed', Cancelled: 'status-cancelled',
    Active: 'status-confirmed', Inactive: 'status-cancelled',
};

const EMPTY_HOTEL_FORM = {
    name: '', description: '', address: '', city: '', country: '',
    postalCode: '', starRating: 3, phoneNumber: '', email: '',
    website: '', checkInTime: '15:00', checkOutTime: '11:00', mainImageUrl: '',
    amenityIds: [],
    rooms: []
};

const EMPTY_ROOM_FORM = {
    roomNumber: '', roomType: 'Standard', pricePerNight: 100,
    capacity: 2, isAvailable: true, amenityIds: []
};

const AdminDashboard = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [hotels, setHotels] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [deletingId, setDeletingId] = useState(null);
    const [isResetting, setIsResetting] = useState(false);
    const [amenitiesList, setAmenitiesList] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [wizardStep, setWizardStep] = useState(1); // 1=Basic, 2=Rooms/Amenities
    const [editingHotel, setEditingHotel] = useState(null); 
    const [hotelForm, setHotelForm] = useState(EMPTY_HOTEL_FORM);
    const [roomForm, setRoomForm] = useState(EMPTY_ROOM_FORM);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchData();
        loadAmenities();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [hotelsRes, bookingsRes] = await Promise.all([getHotels({ status: 'Approved' }), getAllBookings()]);
            setHotels(hotelsRes.data || []);
            setBookings(bookingsRes.data || []);
        } catch {
            setHotels([]);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const loadAmenities = async () => {
        try {
            const res = await getAmenities();
            setAmenitiesList(res.data || []);
        } catch (err) {
            console.error("Failed to load amenities", err);
        }
    };

    const openAddModal = () => {
        setEditingHotel(null);
        setHotelForm(EMPTY_HOTEL_FORM);
        setWizardStep(1);
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (hotel) => {
        setEditingHotel(hotel);
        setHotelForm({
            name: hotel.name || '',
            description: hotel.description || '',
            address: hotel.address || '',
            city: hotel.city || '',
            country: hotel.country || '',
            postalCode: hotel.postalCode || '',
            starRating: hotel.starRating || 3,
            phoneNumber: hotel.phoneNumber || '',
            email: hotel.email || '',
            website: hotel.website || '',
            checkInTime: hotel.checkInTime || '15:00',
            checkOutTime: hotel.checkOutTime || '11:00',
            mainImageUrl: hotel.mainImageUrl || '',
        });
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingHotel(null);
        setHotelForm(EMPTY_HOTEL_FORM);
        setImageFile(null);
        setImagePreview(null);
        setFormError('');
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("File size exceeds 5MB limit.");
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setHotelForm(prev => ({ ...prev, [name]: value }));
    };

    const handleRoomChange = (e) => {
        const { name, value, type, checked } = e.target;
        setRoomForm(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : (name === 'capacity' || name === 'pricePerNight' ? Number(value) : value)
        }));
    };

    const toggleHotelAmenity = (id) => {
        setHotelForm(prev => ({
            ...prev,
            amenityIds: prev.amenityIds.includes(id) 
                ? prev.amenityIds.filter(a => a !== id)
                : [...prev.amenityIds, id]
        }));
    };

    const toggleRoomAmenity = (id) => {
        setRoomForm(prev => ({
            ...prev,
            amenityIds: prev.amenityIds.includes(id) 
                ? prev.amenityIds.filter(a => a !== id)
                : [...prev.amenityIds, id]
        }));
    };

    const addRoomToHotel = () => {
        if (!roomForm.roomNumber || !roomForm.pricePerNight) {
            alert("Room number and price are required.");
            return;
        }
        setHotelForm(prev => ({
            ...prev,
            rooms: [...prev.rooms, { ...roomForm }]
        }));
        setRoomForm(EMPTY_ROOM_FORM);
    };

    const removeRoom = (index) => {
        setHotelForm(prev => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index)
        }));
    };

    const handleSaveHotel = async (e) => {
        e.preventDefault();
        
        if (!editingHotel && wizardStep === 1) {
            setWizardStep(2);
            return;
        }

        setSaving(true);
        setFormError('');
        try {
            let finalImageUrl = hotelForm.mainImageUrl;

            // If a file is selected, upload it first
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);
                const uploadRes = await uploadHotelImage(formData);
                finalImageUrl = `https://localhost:7240${uploadRes.data.imageUrl}`;
            }

            if (!finalImageUrl) {
                throw new Error("Please provide an image URL or upload an image.");
            }

            const payload = { 
                ...hotelForm, 
                mainImageUrl: finalImageUrl,
                starRating: Number(hotelForm.starRating),
            };
            
            if (editingHotel) {
                const res = await updateHotel(editingHotel.id, payload);
                setHotels(prev => prev.map(h => h.id === editingHotel.id ? res.data : h));
            } else {
                if (hotelForm.rooms.length === 0) {
                    throw new Error("Please add at least one room to the hotel.");
                }
                const res = await createHotel(payload);
                setHotels(prev => [...prev, res.data]);
            }
            closeModal();
        } catch (err) {
            setFormError(err?.message || err?.response?.data?.message || 'Failed to save hotel.');
        } finally {
            setSaving(false);
        }
    };

    const handleResetSystem = async () => {
        const confirmed = window.confirm(
            "⚠️ DANGER: This will delete ALL hotels, rooms, and bookings from the database. " +
            "This action is permanent and will be logged. Continue?"
        );
        if (!confirmed) return;

        setIsResetting(true);
        try {
            await deleteAllHotels();
            setHotels([]);
            setBookings([]);
            alert("System reset successful. All data removed.");
        } catch (err) {
            alert("Failed to reset system. Check server logs.");
        } finally {
            setIsResetting(false);
        }
    };

    const handleRemoveNonAdminHotels = async () => {
        const confirmed = window.confirm(
            "This will remove the 6 system-generated hotels that were not created by an admin account. " +
            "Continue?"
        );
        if (!confirmed) return;

        setIsResetting(true);
        try {
            await deleteNonAdminHotels();
            // Refresh the data to reflect the changes
            await fetchData();
            alert("Non-admin hotels have been successfully removed.");
        } catch (err) {
            alert("Failed to remove non-admin hotels. Check server logs.");
        } finally {
            setIsResetting(false);
        }
    };

    const handleDeleteHotel = async (hotelId, hotelName) => {
        if (!window.confirm(`Delete "${hotelName}"? This action cannot be undone.`)) return;
        setDeletingId(hotelId);
        try {
            await deleteHotel(hotelId);
            setHotels(prev => prev.filter(h => h.id !== hotelId));
        } catch {
            alert('Failed to delete hotel. It may have active bookings.');
        } finally {
            setDeletingId(null);
        }
    };

    const totalRevenue = bookings
        .filter(b => b.status !== 'Cancelled')
        .reduce((s, b) => s + (b.totalPrice || 0), 0);
    const totalGuests = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length;

    const TABS = [
        { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
        { key: 'hotels', label: 'Hotels', icon: <Hotel size={16} /> },
        { key: 'bookings', label: 'Booking History', icon: <BookOpen size={16} /> },
    ];

    return (
        <div className="admin-page">
            {/* Admin Sidebar */}
            <aside className="admin-sidebar glass-card">
                <div className="admin-brand">
                    <span className="admin-brand-icon">🏨</span>
                    <span className="admin-brand-text">Admin<span className="text-gradient">Panel</span></span>
                </div>
                <nav className="admin-nav">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`admin-nav-item ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                            id={`admin-tab-${tab.key}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
                <div className="admin-sidebar-footer">
                    <div className="admin-user">
                        <div className="admin-avatar">{user?.firstName?.[0] || 'A'}</div>
                        <div>
                            <div className="admin-user-name">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Admin'}</div>
                            <div className="admin-user-role">Administrator</div>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={() => { logout(); navigate('/'); }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <div className="admin-topbar">
                    <h1 className="admin-page-title">
                        {activeTab === 'overview' && '📊 Dashboard Overview'}
                        {activeTab === 'hotels' && '🏨 Hotel Management'}
                        {activeTab === 'bookings' && '📋 Booking History — All Users'}
                    </h1>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="admin-overview animate-fade-in">
                        <div className="admin-stats-grid">
                            <div className="admin-stat-card glass-card">
                                <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}><Hotel size={22} color="white" /></div>
                                <div className="admin-stat-value">{hotels.length}</div>
                                <div className="admin-stat-label">Total Hotels</div>
                            </div>
                            <div className="admin-stat-card glass-card">
                                <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}><BookOpen size={22} color="white" /></div>
                                <div className="admin-stat-value">{bookings.length}</div>
                                <div className="admin-stat-label">Total Bookings</div>
                            </div>
                            <div className="admin-stat-card glass-card">
                                <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}><TrendingUp size={22} color="white" /></div>
                                <div className="admin-stat-value">₱{totalRevenue.toLocaleString()}</div>
                                <div className="admin-stat-label">Total Revenue</div>
                            </div>
                            <div className="admin-stat-card glass-card">
                                <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}><Users size={22} color="white" /></div>
                                <div className="admin-stat-value">{totalGuests}</div>
                                <div className="admin-stat-label">Guests Served</div>
                            </div>
                        </div>

                        <div className="admin-table-card glass-card">
                            <div className="table-header">
                                <h2>Recent Bookings</h2>
                                <button className="text-link" onClick={() => setActiveTab('bookings')}>View All <ChevronRight size={14} /></button>
                            </div>
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Ref</th><th>Guest</th><th>Hotel</th><th>Amount</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {bookings.slice(0, 5).map(b => (
                                        <tr key={b.id}>
                                            <td><span className="booking-id-cell">{b.bookingReference}</span></td>
                                            <td>{b.guestName || '—'}</td>
                                            <td>{b.hotelName}</td>
                                            <td><strong>₱{(b.totalPrice || 0).toLocaleString()}</strong></td>
                                            <td><span className={`table-badge ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Hotels Tab */}
                {activeTab === 'hotels' && (
                    <div className="admin-hotels animate-fade-in">
                        <div className="admin-section-header">
                            <div>
                                <h2>All Managed Hotels</h2>
                                <p>Manage existing hotels or add a new one with rooms and amenities.</p>
                            </div>
                            <div className="admin-header-actions">
                                <button className="btn btn-danger btn-outline" onClick={handleRemoveNonAdminHotels} disabled={isResetting} title="Remove 6 system hotels">
                                    <Trash2 size={16} /> {isResetting ? 'Removing...' : 'Remove Non-Admin Hotels'}
                                </button>
                                <button className="btn btn-danger btn-outline" onClick={handleResetSystem} disabled={isResetting}>
                                    <ShieldAlert size={16} /> {isResetting ? 'Resetting...' : 'Reset System'}
                                </button>
                                <button className="btn btn-primary" onClick={openAddModal}>
                                    <PlusCircle size={18} /> Add New Hotel
                                </button>
                            </div>
                        </div>

                        <div className="admin-table-card glass-card" style={{ marginTop: '1rem', overflowX: 'auto' }}>
                            {hotels.length === 0 && !loading ? (
                                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                    <Hotel size={48} style={{ marginBottom: '1rem' }} />
                                    <h3>No hotels yet</h3>
                                    <p>Click "Add New Hotel" above to register your first hotel business.</p>
                                </div>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Hotel Name</th>
                                            <th>Location</th>
                                            <th>Stars</th>
                                            <th>Rooms</th>
                                            <th style={{ minWidth: '220px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hotels.map((hotel) => (
                                            <tr key={hotel.id} id={`admin-hotel-row-${hotel.id}`}>
                                                <td><strong>{hotel.name}</strong></td>
                                                <td>{hotel.city}, {hotel.country}</td>
                                                <td>{'⭐'.repeat(hotel.starRating || 0)}</td>
                                                <td>{hotel.rooms?.length ?? '—'}</td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            className="action-btn action-btn-view"
                                                            title="View Hotel Page"
                                                            onClick={() => navigate(`/hotels/${hotel.id}`)}
                                                            id={`view-hotel-${hotel.id}`}
                                                        >
                                                            <Eye size={14} /> View
                                                        </button>
                                                        <button
                                                            className="action-btn action-btn-edit"
                                                            title="Edit Hotel"
                                                            onClick={() => openEditModal(hotel)}
                                                            id={`edit-hotel-${hotel.id}`}
                                                        >
                                                            <Edit3 size={14} /> Edit
                                                        </button>
                                                        <button
                                                            className="action-btn action-btn-delete"
                                                            title="Delete Hotel"
                                                            disabled={deletingId === hotel.id}
                                                            onClick={() => handleDeleteHotel(hotel.id, hotel.name)}
                                                            id={`delete-hotel-${hotel.id}`}
                                                        >
                                                            {deletingId === hotel.id ? '⌛' : <><Trash2 size={14} /> Delete</>}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Booking History Tab (All Users) */}
                {activeTab === 'bookings' && (
                    <div className="admin-bookings-tab animate-fade-in">
                        <div className="admin-section-header">
                            <div>
                                <h2>Complete Booking Records</h2>
                                <p>View and filter all reservations made across the platform.</p>
                            </div>
                            <button className="btn btn-outline" onClick={() => window.open('https://localhost:7240/api/Bookings/export-csv', '_blank')}>
                                <Save size={16} /> Export CSV
                            </button>
                        </div>

                        <div className="admin-table-card glass-card">
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Ref</th><th>Guest</th><th>Email</th><th>Hotel</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Amount</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b.id}>
                                            <td><span className="booking-id-cell">{b.bookingReference}</span></td>
                                            <td>{b.guestName || '—'}</td>
                                            <td style={{ fontSize: '0.75rem', opacity: 0.7 }}>{b.guestEmail || '—'}</td>
                                            <td>{b.hotelName}</td>
                                            <td>{b.roomType} ({b.roomNumber})</td>
                                            <td>{b.checkInDate?.substring(0, 10)}</td>
                                            <td>{b.checkOutDate?.substring(0, 10)}</td>
                                            <td><strong>₱{(b.totalPrice || 0).toLocaleString()}</strong></td>
                                            <td><span className={`table-badge ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                                        </tr>
                                    ))}
                                    {bookings.length === 0 && !loading && (
                                        <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No bookings recorded yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Add / Edit Hotel Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content glass-card animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {editingHotel ? <Edit3 size={20} /> : <PlusCircle size={20} />}
                                {editingHotel ? 'Edit Hotel Details' : 'Add New Hotel Wizard'}
                                {!editingHotel && <span className="wizard-badge">Step {wizardStep} of 2</span>}
                            </h2>
                            <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveHotel}>
                            <div className="modal-body">
                                {formError && <div className="alert alert-error">{formError}</div>}
                                
                                {wizardStep === 1 ? (
                                    <div className="wizard-step animate-fade-in">
                                        <div className="form-section-title">
                                            <Hotel size={16} /> Basic Property Information
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Hotel Name *</label>
                                            <input className="input-field" name="name" value={hotelForm.name} onChange={handleFormChange} required placeholder="Grand Plaza Hotel" />
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Description *</label>
                                            <textarea className="input-field" name="description" value={hotelForm.description} onChange={handleFormChange} required rows={3} placeholder="Describe the hotel's unique features..." />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="input-label">City *</label>
                                                <input className="input-field" name="city" value={hotelForm.city} onChange={handleFormChange} required placeholder="Paris" />
                                            </div>
                                            <div className="form-group">
                                                <label className="input-label">Country *</label>
                                                <input className="input-field" name="country" value={hotelForm.country} onChange={handleFormChange} required placeholder="France" />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Full Address *</label>
                                            <input className="input-field" name="address" value={hotelForm.address} onChange={handleFormChange} required placeholder="123 Rue de Rivoli" />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="input-label">Star Rating</label>
                                                <select className="input-field" name="starRating" value={hotelForm.starRating} onChange={handleFormChange}>
                                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="input-label">Phone Number</label>
                                                <input className="input-field" name="phoneNumber" value={hotelForm.phoneNumber} onChange={handleFormChange} placeholder="+33 1 23 45 67 89" />
                                            </div>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label className="input-label">Hotel Image (URL or Upload)</label>
                                            <div className="image-input-container">
                                                <input className="input-field" name="mainImageUrl" value={hotelForm.mainImageUrl} onChange={handleFormChange} placeholder="https://images.unsplash.com/..." disabled={!!imageFile} />
                                                <div className="divider-text"><span>OR</span></div>
                                                <div className="upload-box-wrapper">
                                                    <label className={`upload-box ${imagePreview ? 'has-preview' : ''}`}>
                                                        <input type="file" hidden onChange={handleImageChange} accept="image/jpeg,image/png,image/webp" />
                                                        {imagePreview ? (
                                                            <img src={imagePreview} alt="Preview" className="preview-img" />
                                                        ) : (
                                                            <div className="upload-placeholder">
                                                                <Upload size={20} />
                                                                <span>Upload File</span>
                                                            </div>
                                                        )}
                                                    </label>
                                                    {imageFile && (
                                                        <button type="button" className="btn-remove-image" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                                                            <X size={12} /> Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="amenities-selection">
                                            <label className="input-label"><Zap size={14} /> Hotel Amenities</label>
                                            <div className="amenities-chips">
                                                {amenitiesList.map(amenity => (
                                                    <button 
                                                        key={amenity.id} 
                                                        type="button"
                                                        className={`amenity-chip ${hotelForm.amenityIds.includes(amenity.id) ? 'active' : ''}`}
                                                        onClick={() => toggleHotelAmenity(amenity.id)}
                                                    >
                                                        {amenity.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="wizard-step animate-fade-in">
                                        <div className="form-section-title">
                                            <Grid size={16} /> Room Management
                                        </div>
                                        
                                        <div className="add-room-subform glass-card">
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="input-label">Room Number/Name</label>
                                                    <input className="input-field" name="roomNumber" value={roomForm.roomNumber} onChange={handleRoomChange} placeholder="101, Deluxe Suite, etc." />
                                                </div>
                                                <div className="form-group">
                                                    <label className="input-label">Room Type</label>
                                                    <select className="input-field" name="roomType" value={roomForm.roomType} onChange={handleRoomChange}>
                                                        <option>Standard</option>
                                                        <option>Deluxe</option>
                                                        <option>Suite</option>
                                                        <option>Penthouse</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="input-label">Price per Night (₱)</label>
                                                    <input className="input-field" type="number" name="pricePerNight" value={roomForm.pricePerNight} onChange={handleRoomChange} step="0.01" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="input-label">Capacity (Guests)</label>
                                                    <input className="input-field" type="number" name="capacity" value={roomForm.capacity} onChange={handleRoomChange} />
                                                </div>
                                            </div>
                                            
                                            <div className="room-amenities-selection">
                                                <label className="input-label">Room Amenities</label>
                                                <div className="amenities-chips mini">
                                                    {amenitiesList.map(amenity => (
                                                        <button 
                                                            key={amenity.id} 
                                                            type="button"
                                                            className={`amenity-chip ${roomForm.amenityIds.includes(amenity.id) ? 'active' : ''}`}
                                                            onClick={() => toggleRoomAmenity(amenity.id)}
                                                        >
                                                            {amenity.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={addRoomToHotel}>
                                                <PlusCircle size={14} /> Add Room to Hotel
                                            </button>
                                        </div>

                                        <div className="added-rooms-list mt-4">
                                            <h4>Added Rooms ({hotelForm.rooms.length})</h4>
                                            {hotelForm.rooms.length === 0 ? (
                                                <p className="text-muted text-center py-4">No rooms added yet. Please add at least one.</p>
                                            ) : (
                                                <div className="rooms-preview-grid">
                                                    {hotelForm.rooms.map((room, idx) => (
                                                        <div key={idx} className="room-preview-card">
                                                            <div className="room-preview-info">
                                                                <strong>{room.roomNumber}</strong>
                                                                <span>{room.roomType} · ₱{room.pricePerNight.toLocaleString()}</span>
                                                            </div>
                                                            <button type="button" className="btn-remove-room" onClick={() => removeRoom(idx)}>
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                                <div className="footer-actions">
                                    {wizardStep === 2 && !editingHotel && (
                                        <button type="button" className="btn btn-outline" onClick={() => setWizardStep(1)}>
                                            ← Back
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn-primary" disabled={saving} id="save-hotel-btn">
                                        <Save size={18} /> {saving ? 'Saving...' : (editingHotel ? 'Save Changes' : (wizardStep === 1 ? 'Next: Add Rooms →' : 'Complete Registration'))}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
