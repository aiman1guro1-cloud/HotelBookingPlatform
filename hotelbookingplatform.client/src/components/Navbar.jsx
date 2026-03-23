import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Menu, X, User, LogIn, LayoutDashboard, Shield, LogOut, ChevronDown } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import './Navbar.css';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    // Close user menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        navigate('/');
    };

    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

    return (
        <header className="navbar glass-card">
            <div className="container nav-container">

                {/* Brand Logo */}
                <Link to="/" className="nav-brand">
                    <Home className="brand-icon text-primary" size={28} />
                    <span className="brand-text">Haven<span className="text-gradient">Book</span></span>
                </Link>

                {/* Navigation Links (Desktop) */}
                <nav className={`nav-links ${mobileOpen ? 'nav-open' : ''}`}>
                    <Link to="/" className={isActive('/')}>Home</Link>
                    <Link to="/hotels" className={isActive('/hotels')}>Hotels</Link>
                    <Link to="/about" className={isActive('/about')}>About</Link>
                    {isAuthenticated && (
                        <Link to="/dashboard" className={isActive('/dashboard')}>My Bookings</Link>
                    )}
                    {isAuthenticated && user?.role?.toLowerCase() === 'admin' && (
                        <Link to="/admin" className={isActive('/admin')} style={{ color: '#7C3AED', fontWeight: 700 }}>
                            <Shield size={14} /> Admin Panel
                        </Link>
                    )}
                </nav>

                {/* Auth / Action Buttons */}
                <div className="nav-actions">
                    {isAuthenticated ? (
                        /* User Dropdown Menu */
                        <div className="user-menu-wrapper" ref={userMenuRef}>
                            <button
                                className="user-menu-trigger"
                                onClick={() => setUserMenuOpen(p => !p)}
                                id="user-menu-trigger"
                            >
                                <div className="user-avatar-sm">
                                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                                </div>
                                <span className="user-name-sm">{user?.firstName || 'Account'}</span>
                                <ChevronDown size={14} className={`chevron ${userMenuOpen ? 'rotated' : ''}`} />
                            </button>
                            {userMenuOpen && (
                                <div className="user-dropdown animate-fade-in" id="user-dropdown-menu">
                                    <div className="dropdown-header">
                                        <div className="dropdown-avatar">
                                            {user?.firstName?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <div className="dropdown-name">{user?.firstName} {user?.lastName || ''}</div>
                                            <div className="dropdown-email">{user?.email}</div>
                                        </div>
                                    </div>
                                    <div className="dropdown-divider" />
                                    <Link to="/dashboard" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                        <LayoutDashboard size={15} /> My Bookings
                                    </Link>
                                    <Link to="/settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                        <User size={15} /> Account Settings
                                    </Link>
                                    {user?.role?.toLowerCase() === 'admin' && (
                                        <Link to="/admin" className="dropdown-item" style={{ color: '#7C3AED', fontWeight: 600, background: 'rgba(124,58,237,0.06)' }} onClick={() => setUserMenuOpen(false)}>
                                            <Shield size={15} /> Admin Panel
                                        </Link>
                                    )}
                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item dropdown-logout" onClick={handleLogout} id="logout-btn">
                                        <LogOut size={15} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Auth Buttons for Guest */
                        <>
                            <Link to="/login" className="btn btn-outline nav-btn">
                                <LogIn size={18} />
                                <span>Login</span>
                            </Link>
                            <Link to="/register" className="btn btn-primary nav-btn">
                                <User size={18} />
                                <span>Sign Up</span>
                            </Link>
                        </>
                    )}

                    {/* Mobile Hamburger */}
                    <button className="mobile-menu-btn" onClick={() => setMobileOpen(p => !p)} id="mobile-menu-btn">
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

            </div>
        </header>
    );
};

export default Navbar;
