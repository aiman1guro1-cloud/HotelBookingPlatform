import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Users, Star } from 'lucide-react';
import { getHotels } from '../services/hotelService';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const [destination, setDestination] = useState('');
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHotels();
        
        // Polling for real-time synchronization (every 30 seconds)
        const interval = setInterval(fetchHotels, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchHotels = async () => {
        try {
            // Fetch all approved hotels
            const response = await getHotels({ status: 'Approved' });
            setHotels(response.data || []);
        } catch (error) {
            console.error("Error fetching hotels:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-background animate-fade-in">
                    <div className="hero-overlay"></div>
                </div>

                <div className="container hero-content">
                    <h1 className="hero-title animate-float">
                        Find Your Next <br />
                        <span className="text-gradient">Perfect Stay</span>
                    </h1>
                    <p className="hero-subtitle mb-8">
                        Discover extraordinary homes, hotels, and experiences around the world.
                    </p>

                    {/* Search Glass Card */}
                    <div className="search-bar glass-card">
                        <div className="search-inputs">
                            <div className="search-field">
                                <MapPin className="search-icon" size={20} />
                                <div className="field-group">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        placeholder="Where are you going?"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="search-divider"></div>
                            <div className="search-field">
                                <Calendar className="search-icon" size={20} />
                                <div className="field-group">
                                    <label>Check in - Check out</label>
                                    <input type="text" placeholder="Add dates" />
                                </div>
                            </div>
                            <div className="search-divider"></div>
                            <div className="search-field">
                                <Users className="search-icon" size={20} />
                                <div className="field-group">
                                    <label>Guests</label>
                                    <input type="text" placeholder="1 guest, 1 room" />
                                </div>
                            </div>
                            <button className="btn btn-primary search-btn">
                                <Search size={20} />
                                <span>Search</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dynamic Hotel Listing Section */}
            <section className="featured-section container">
                <h2 className="section-title">Explore Our <span className="text-gradient">Hotels</span></h2>
                <p className="section-subtitle mb-8">Hand-picked properties approved by our administration for your comfort</p>

                {loading ? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Loading amazing stays...</p>
                    </div>
                ) : hotels.length === 0 ? (
                    <div className="empty-state glass-card">
                        <p>No hotels available at the moment. Please check back later!</p>
                    </div>
                ) : (
                    <div className="featured-grid">
                        {hotels.map((hotel) => (
                            <div 
                                key={hotel.id} 
                                className="hotel-card glass-card animate-fade-in"
                                onClick={() => navigate(`/hotels/${hotel.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div 
                                    className="card-image-box"
                                    style={{ 
                                        backgroundImage: `url(${hotel.mainImageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        height: '200px'
                                    }}
                                >
                                    <div className="card-badge">{hotel.status}</div>
                                </div>
                                <div className="card-content">
                                    <div className="card-header">
                                        <h3>{hotel.name}</h3>
                                        <div className="rating">
                                            <Star size={14} fill="currentColor" />
                                            <span>{hotel.starRating}.0</span>
                                        </div>
                                    </div>
                                    <p className="location">
                                        <MapPin size={14} /> {hotel.city}, {hotel.country}
                                    </p>
                                    <div className="price-tag mt-4">
                                        <span className="price">₱{(hotel.pricePerNight || 0).toLocaleString()}</span> / night
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Home;
