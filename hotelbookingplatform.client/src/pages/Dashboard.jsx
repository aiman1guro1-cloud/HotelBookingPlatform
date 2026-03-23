import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, XCircle, CheckCircle, ChevronRight, User, LogOut } from 'lucide-react';
import { getMyBookings, cancelBooking } from '../services/bookingService';
import useAuthStore from '../stores/useAuthStore';
import './Dashboard.css';

const STATUS_CONFIG = {
    Confirmed: { color: 'status-confirmed', icon: <CheckCircle size={14} />, label: 'Confirmed' },
    Pending: { color: 'status-pending', icon: <Clock size={14} />, label: 'Pending' },
    Completed: { color: 'status-completed', icon: <CheckCircle size={14} />, label: 'Completed' },
    Cancelled: { color: 'status-cancelled', icon: <XCircle size={14} />, label: 'Cancelled' },
};

const Dashboard = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            try {
                const response = await getMyBookings();
                setBookings(response.data || []);
            } catch {
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const handleCancel = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        setCancellingId(bookingId);
        try {
            await cancelBooking(bookingId);
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Cancelled' } : b));
        } catch {
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Cancelled' } : b));
        } finally {
            setCancellingId(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const FILTERS = ['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'];
    const filteredBookings = activeFilter === 'All' ? bookings : bookings.filter(b => b.status === activeFilter);

    const stats = {
        total: bookings.length,
        upcoming: bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending').length,
        spent: bookings.filter(b => b.status !== 'Cancelled').reduce((s, b) => s + b.totalAmount, 0),
    };

    return (
        <div className="dashboard-page">
            <div className="container dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <div className="dashboard-welcome">
                        <div className="user-avatar">
                            {user?.firstName?.[0] || user?.email?.[0] || 'G'}
                        </div>
                        <div>
                            <h1 className="welcome-text">Welcome back, <span className="text-gradient">{user?.firstName || 'Guest'}</span> 👋</h1>
                            <p className="welcome-sub">{user?.email || 'Manage your stays and reservations'}</p>
                        </div>
                    </div>
                    <div className="dashboard-header-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => navigate('/hotels')}>
                            <ChevronRight size={16} /> Book New Stay
                        </button>
                        <button className="btn-logout" onClick={handleLogout}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="dashboard-stats">
                    <div className="stat-card glass-card">
                        <div className="stat-icon">🏨</div>
                        <div><div className="stat-value">{stats.total}</div><div className="stat-label">Total Bookings</div></div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon">✈️</div>
                        <div><div className="stat-value">{stats.upcoming}</div><div className="stat-label">Upcoming Trips</div></div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon">💰</div>
                        <div><div className="stat-value">${stats.spent.toLocaleString()}</div><div className="stat-label">Total Spent</div></div>
                    </div>
                </div>

                {/* Bookings Section */}
                <div className="dashboard-bookings glass-card">
                    <div className="bookings-toolbar">
                        <h2 className="bookings-title">My Bookings</h2>
                        <div className="booking-filters">
                            {FILTERS.map(f => (
                                <button
                                    key={f}
                                    className={`filter-pill ${activeFilter === f ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="bookings-loading">
                            {[1, 2, 3].map(i => <div key={i} className="booking-skeleton" />)}
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="no-bookings">
                            <div className="no-bookings-icon">🏝️</div>
                            <h3>No {activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} bookings yet</h3>
                            <p>Ready to plan your next adventure?</p>
                            <button className="btn btn-primary" onClick={() => navigate('/hotels')}>Browse Hotels</button>
                        </div>
                    ) : (
                        <div className="bookings-list">
                            {filteredBookings.map((booking, idx) => {
                                const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.Pending;
                                const canCancel = booking.status === 'Confirmed' || booking.status === 'Pending';
                                return (
                                    <div key={booking.id} className="booking-item animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }} id={`booking-${booking.id}`}>
                                        <div className="booking-hotel-bar" style={{ background: `linear-gradient(135deg, hsl(${(booking.hotelId * 47) % 360}, 60%, 40%), hsl(${(booking.hotelId * 47 + 60) % 360}, 70%, 55%))` }}>
                                            <span className={`booking-status-badge ${statusCfg.color}`}>{statusCfg.icon} {statusCfg.label}</span>
                                        </div>
                                        <div className="booking-item-body">
                                            <div className="booking-info">
                                                <div className="booking-main-info">
                                                    <h3 className="booking-hotel-name">{booking.hotelName}</h3>
                                                    <p className="booking-room-name">{booking.roomName}</p>
                                                    <div className="booking-meta">
                                                        <span><MapPin size={13} /> {booking.city}, {booking.country}</span>
                                                        <span><Calendar size={13} /> {booking.checkIn} → {booking.checkOut}</span>
                                                        <span><Clock size={13} /> {booking.nights} nights</span>
                                                    </div>
                                                </div>
                                                <div className="booking-amount-area">
                                                    <div className="booking-ref">Ref: {booking.id}</div>
                                                    <div className="booking-amount">${booking.totalAmount.toLocaleString()}</div>
                                                    <div className="booking-amount-label">Total Paid</div>
                                                </div>
                                            </div>
                                            {canCancel && (
                                                <div className="booking-actions">
                                                    <button
                                                        className="btn-cancel-booking"
                                                        onClick={() => handleCancel(booking.id)}
                                                        disabled={cancellingId === booking.id}
                                                        id={`cancel-booking-${booking.id}`}
                                                    >
                                                        {cancellingId === booking.id ? '⌛ Cancelling...' : <><XCircle size={14} /> Cancel Booking</>}
                                                    </button>
                                                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/hotels/${booking.hotelId}`)}>
                                                        View Hotel <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
