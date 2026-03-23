import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Wifi, Car, Utensils, Dumbbell, ArrowLeft, Calendar, Users, Check, ChevronRight } from 'lucide-react';
import { getHotelById, getRoomsByHotel } from '../services/hotelService';
import './HotelDetail.css';

const AMENITY_MAP = {
    wifi: { icon: <Wifi size={16} />, label: 'Free WiFi' },
    pool: { icon: '🏊', label: 'Swimming Pool' },
    restaurant: { icon: <Utensils size={16} />, label: 'Restaurant' },
    gym: { icon: <Dumbbell size={16} />, label: 'Fitness Center' },
    parking: { icon: <Car size={16} />, label: 'Free Parking' },
    spa: { icon: '💆', label: 'Spa & Wellness' },
    concierge: { icon: '🛎️', label: '24/7 Concierge' },
    'room service': { icon: '🍽️', label: 'Room Service' },
};

const HotelDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [hotel, setHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);
    const [activeTab, setActiveTab] = useState('rooms');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [hotelRes, roomsRes] = await Promise.all([
                    getHotelById(id),
                    getRoomsByHotel(id),
                ]);
                setHotel(hotelRes.data);
                setRooms(roomsRes.data || []);
            } catch {
                setHotel(null);
                setRooms([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const calcNights = () => {
        if (!checkIn || !checkOut) return 0;
        const diff = new Date(checkOut) - new Date(checkIn);
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const handleBookRoom = (room) => {
        if (!room.available) return;
        navigate('/checkout', {
            state: {
                hotel,
                room,
                checkIn,
                checkOut,
                guests,
                nights: calcNights() || 1,
            }
        });
    };

    if (loading) return (
        <div className="hotel-detail-loading container">
            <div className="detail-skeleton" />
        </div>
    );

    if (!hotel) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Hotel not found.</div>;

    return (
        <div className="hotel-detail-page">
            {/* Hero Banner */}
            <div className="hotel-detail-hero" style={{ background: `linear-gradient(135deg, hsl(${(Number(id) * 47) % 360}, 60%, 25%), hsl(${(Number(id) * 47 + 60) % 360}, 60%, 40%))` }}>
                <div className="container">
                    <button className="back-btn" onClick={() => navigate('/hotels')}>
                        <ArrowLeft size={18} /> Back to Hotels
                    </button>
                    <div className="hotel-detail-title-area">
                        <div>
                            <h1 className="hotel-detail-name">{hotel.name}</h1>
                            <p className="hotel-detail-location"><MapPin size={16} /> {hotel.address || `${hotel.city}, ${hotel.country}`}</p>
                        </div>
                        <div className="hotel-detail-rating">
                            <Star size={20} fill="#F59E0B" color="#F59E0B" />
                            <span className="rating-value">{hotel.rating}</span>
                            <span className="review-count">({hotel.reviewCount} reviews)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container hotel-detail-body">
                {/* Date/Guest Picker Bar */}
                <div className="booking-bar glass-card">
                    <div className="booking-bar-field">
                        <Calendar size={16} className="booking-bar-icon" />
                        <div>
                            <label htmlFor="check-in-date">Check-In</label>
                            <input id="check-in-date" type="date" value={checkIn} min={new Date().toISOString().split('T')[0]} onChange={e => setCheckIn(e.target.value)} />
                        </div>
                    </div>
                    <div className="booking-bar-divider" />
                    <div className="booking-bar-field">
                        <Calendar size={16} className="booking-bar-icon" />
                        <div>
                            <label htmlFor="check-out-date">Check-Out</label>
                            <input id="check-out-date" type="date" value={checkOut} min={checkIn || new Date().toISOString().split('T')[0]} onChange={e => setCheckOut(e.target.value)} />
                        </div>
                    </div>
                    <div className="booking-bar-divider" />
                    <div className="booking-bar-field">
                        <Users size={16} className="booking-bar-icon" />
                        <div>
                            <label htmlFor="guest-count">Guests</label>
                            <input id="guest-count" type="number" min="1" max="10" value={guests} onChange={e => setGuests(Number(e.target.value))} />
                        </div>
                    </div>
                    {calcNights() > 0 && (
                        <div className="booking-bar-nights">
                            <span className="nights-count">{calcNights()}</span>
                            <span className="nights-label">nights</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="detail-tabs">
                    {['rooms', 'overview', 'amenities'].map(tab => (
                        <button
                            key={tab}
                            className={`detail-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tab: Rooms */}
                {activeTab === 'rooms' && (
                    <div className="rooms-list animate-fade-in">
                        {rooms.map((room, idx) => (
                            <div
                                key={room.id}
                                className={`room-card glass-card ${!room.available ? 'unavailable' : ''} animate-fade-in`}
                                style={{ animationDelay: `${idx * 0.06}s` }}
                                id={`room-card-${room.id}`}
                            >
                                <div className="room-image-col">
                                    <div className="room-img-placeholder" style={{ background: `linear-gradient(135deg, hsl(${idx * 60 + 200}, 50%, 55%), hsl(${idx * 60 + 260}, 60%, 40%))` }}>
                                        <span className="room-category-tag">{room.category}</span>
                                        {!room.available && <span className="sold-out-tag">Sold Out</span>}
                                    </div>
                                </div>
                                <div className="room-info-col">
                                    <h3 className="room-name">{room.name}</h3>
                                    <div className="room-meta">
                                        <span>🛏 {room.beds}</span>
                                        <span>📐 {room.size}</span>
                                        <span>👥 Up to {room.maxGuests} guests</span>
                                    </div>
                                    <p className="room-desc">{room.description}</p>
                                    <div className="room-amenities">
                                        {room.amenities?.map(a => (
                                            <span key={a} className="room-amenity-tag">
                                                <Check size={11} /> {a}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="room-booking-col">
                                    <div className="room-price">
                                        <span className="price-value">${room.pricePerNight}</span>
                                        <span className="price-per">per night</span>
                                    </div>
                                    {calcNights() > 0 && (
                                        <div className="room-total">Total: <strong>${room.pricePerNight * calcNights()}</strong></div>
                                    )}
                                    <button
                                        className={`btn ${room.available ? 'btn-primary' : 'btn-disabled'} book-btn`}
                                        disabled={!room.available}
                                        onClick={() => handleBookRoom(room)}
                                        id={`book-room-${room.id}`}
                                    >
                                        {room.available ? <><ChevronRight size={16} /> Reserve Now</> : 'Unavailable'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab: Overview */}
                {activeTab === 'overview' && (
                    <div className="hotel-overview animate-fade-in glass-card">
                        <h2>About {hotel.name}</h2>
                        <p>{hotel.description}</p>
                        {hotel.phone && <p className="hotel-contact">📞 {hotel.phone}</p>}
                    </div>
                )}

                {/* Tab: Amenities */}
                {activeTab === 'amenities' && (
                    <div className="hotel-amenities-grid animate-fade-in glass-card">
                        <h2>Hotel Amenities</h2>
                        <div className="amenities-list">
                            {hotel.amenities?.map(a => (
                                <div key={a} className="amenity-item">
                                    <span className="amenity-icon">{AMENITY_MAP[a]?.icon || '✓'}</span>
                                    <span>{AMENITY_MAP[a]?.label || a}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HotelDetail;
