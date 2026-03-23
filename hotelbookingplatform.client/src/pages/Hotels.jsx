import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Wifi, Car, Utensils, Waves, Dumbbell, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { getHotels } from '../services/hotelService';
import './Hotels.css';

const AMENITY_ICONS = {
    wifi: <Wifi size={14} />,
    pool: <Waves size={14} />,
    restaurant: <Utensils size={14} />,
    parking: <Car size={14} />,
    gym: <Dumbbell size={14} />,
};

const CATEGORIES = ['All', 'Luxury', 'Resort', 'Boutique', 'Villa', 'Budget'];
const AMENITY_FILTERS = ['wifi', 'pool', 'restaurant', 'parking', 'gym'];

const Hotels = () => {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Filters
    const [searchQuery, setSearchQuery] = useState(searchParams.get('destination') || '');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [minRating, setMinRating] = useState(0);
    const [selectedAmenities, setSelectedAmenities] = useState([]);
    const [sortBy, setSortBy] = useState('rating');
    const [showFilters, setShowFilters] = useState(false);

    const fetchHotels = useCallback(async () => {
        setLoading(true);
        try {
            const params = { search: searchQuery };
            const response = await getHotels(params);
            // Map backend fields to frontend expected fields
            const realHotels = (response.data || []).map(h => ({
                ...h,
                rating: h.starRating || 0,
                pricePerNight: h.pricePerNight || 0,
                category: h.category || 'Luxury', // Fallback if backend doesn't have category
                amenities: h.amenities || ['wifi'], // Fallback
            }));

            // If DB is totally empty, show an empty list
            setHotels(realHotels);
        } catch {
            setHotels([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchHotels();
    }, [fetchHotels]);

    const toggleAmenity = (amenity) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
        );
    };

    const filteredHotels = hotels
        .filter(h => {
            const matchesSearch = !searchQuery ||
                (h.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (h.city?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (h.country?.toLowerCase() || '').includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
            const matchesPrice = h.pricePerNight >= priceRange[0] && h.pricePerNight <= priceRange[1];
            const matchesRating = h.rating >= minRating;
            const matchesAmenities = selectedAmenities.length === 0 || selectedAmenities.every(a => h.amenities?.includes(a));
            return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesAmenities;
        })
        .sort((a, b) => {
            if (sortBy === 'rating') return b.rating - a.rating;
            if (sortBy === 'price_asc') return a.pricePerNight - b.pricePerNight;
            if (sortBy === 'price_desc') return b.pricePerNight - a.pricePerNight;
            return 0;
        });

    const clearFilters = () => {
        setSelectedCategory('All');
        setPriceRange([0, 1000]);
        setMinRating(0);
        setSelectedAmenities([]);
        setSearchQuery('');
    };

    const activeFilterCount = [
        selectedCategory !== 'All' ? 1 : 0,
        selectedAmenities.length,
        minRating > 0 ? 1 : 0,
        priceRange[1] < 1000 ? 1 : 0
    ].reduce((a, b) => a + b, 0);

    return (
        <div className="hotels-page">
            {/* Page Header */}
            <section className="hotels-hero">
                <div className="container hotels-hero-content">
                    <h1 className="hotels-title">Explore <span className="text-gradient">Hotels</span></h1>
                    <p className="hotels-subtitle">Find the perfect stay for your next adventure</p>

                    {/* Top Search Bar */}
                    <div className="hotels-search-bar glass-card">
                        <div className="hotels-search-input-wrapper">
                            <MapPin size={18} className="hotels-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by city, hotel name, or country..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="hotels-search-input"
                                id="hotel-search-input"
                            />
                            {searchQuery && (
                                <button className="clear-search-btn" onClick={() => setSearchQuery('')}><X size={16} /></button>
                            )}
                        </div>
                        <button className="btn btn-primary hotels-search-btn" onClick={fetchHotels}>
                            <Search size={18} /> Search
                        </button>
                    </div>
                </div>
            </section>

            <div className="container hotels-main">
                {/* Toolbar */}
                <div className="hotels-toolbar">
                    <div className="results-count">
                        <span className="count-badge">{filteredHotels.length}</span> hotels found
                    </div>
                    <div className="toolbar-right">
                        {/* Sort */}
                        <div className="sort-wrapper">
                            <label htmlFor="sort-select">Sort by:</label>
                            <div className="select-wrapper">
                                <select id="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                    <option value="rating">Top Rated</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                </select>
                                <ChevronDown size={14} className="select-arrow" />
                            </div>
                        </div>
                        {/* Filter Toggle (Mobile) */}
                        <button
                            className={`btn-filter ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(p => !p)}
                            id="toggle-filters-btn"
                        >
                            <SlidersHorizontal size={18} />
                            Filters {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
                        </button>
                    </div>
                </div>

                <div className="hotels-layout">
                    {/* Sidebar Filters */}
                    <aside className={`filters-sidebar glass-card ${showFilters ? 'filters-open' : ''}`}>
                        <div className="filters-header">
                            <h3><Filter size={18} /> Filters</h3>
                            {activeFilterCount > 0 && (
                                <button className="clear-all-btn" onClick={clearFilters}>Clear All</button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <div className="filter-group">
                            <h4 className="filter-label">Property Type</h4>
                            <div className="category-chips">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >{cat}</button>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="filter-group">
                            <h4 className="filter-label">Price per Night</h4>
                            <div className="price-range-display">
                                <span>${priceRange[0]}</span> — <span>${priceRange[1]}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="1000" step="10"
                                value={priceRange[1]}
                                onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                                className="range-slider"
                                id="price-range-slider"
                            />
                        </div>

                        {/* Rating Filter */}
                        <div className="filter-group">
                            <h4 className="filter-label">Minimum Rating</h4>
                            <div className="rating-buttons">
                                {[0, 3, 4, 4.5, 4.8].map(r => (
                                    <button
                                        key={r}
                                        className={`rating-btn ${minRating === r ? 'active' : ''}`}
                                        onClick={() => setMinRating(r)}
                                    >
                                        {r === 0 ? 'Any' : `${r}+`} {r > 0 && <Star size={12} fill="currentColor" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="filter-group">
                            <h4 className="filter-label">Amenities</h4>
                            <div className="amenity-checkboxes">
                                {AMENITY_FILTERS.map(amenity => (
                                    <label key={amenity} className={`amenity-check ${selectedAmenities.includes(amenity) ? 'checked' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedAmenities.includes(amenity)}
                                            onChange={() => toggleAmenity(amenity)}
                                        />
                                        {AMENITY_ICONS[amenity]}
                                        <span>{amenity.charAt(0).toUpperCase() + amenity.slice(1)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Hotel Grid */}
                    <main className="hotels-grid-area">
                        {loading ? (
                            <div className="hotels-loading">
                                {[1, 2, 3].map(i => <div key={i} className="hotel-skeleton" />)}
                            </div>
                        ) : filteredHotels.length === 0 ? (
                            <div className="no-results glass-card">
                                <Search size={48} className="no-results-icon" />
                                <h3>No hotels found</h3>
                                <p>Try adjusting your filters or search term.</p>
                                <button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
                            </div>
                        ) : (
                            <div className="hotels-grid">
                                {filteredHotels.map((hotel, idx) => (
                                    <div
                                        key={hotel.id}
                                        className="hotel-card-v2 glass-card animate-fade-in"
                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                        onClick={() => navigate(`/hotels/${hotel.id}`)}
                                        id={`hotel-card-${hotel.id}`}
                                    >
                                        <div className="hotel-card-image">
                                            <div className="hotel-img-placeholder" style={{ background: `linear-gradient(135deg, hsl(${(hotel.id * 47) % 360}, 60%, 40%), hsl(${(hotel.id * 47 + 60) % 360}, 70%, 55%))` }}>
                                                <span className="hotel-category-badge">{hotel.category}</span>
                                            </div>
                                        </div>
                                        <div className="hotel-card-body">
                                            <div className="hotel-card-header">
                                                <div>
                                                    <h3 className="hotel-name">{hotel.name}</h3>
                                                    <p className="hotel-location">
                                                        <MapPin size={13} /> {hotel.city}, {hotel.country}
                                                    </p>
                                                </div>
                                                <div className="hotel-rating-badge">
                                                    <Star size={14} fill="#F59E0B" color="#F59E0B" />
                                                    <span>{hotel.rating}</span>
                                                </div>
                                            </div>
                                            <p className="hotel-description">{hotel.description}</p>
                                            <div className="hotel-amenities">
                                                {hotel.amenities?.slice(0, 4).map(a => (
                                                    <span key={a} className="amenity-tag">{AMENITY_ICONS[a]} {a}</span>
                                                ))}
                                            </div>
                                            <div className="hotel-card-footer">
                                                <div className="hotel-price">
                                                    <span className="price-amount">${hotel.pricePerNight}</span>
                                                    <span className="price-unit">/ night</span>
                                                </div>
                                                <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/hotels/${hotel.id}`); }}>
                                                    View Rooms
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Hotels;
