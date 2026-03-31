import { Code2, User, Mail, Phone, Info, Building2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './About.css';

const About = () => {
    const navigate = useNavigate();

    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="about-hero-background animate-fade-in">
                    <div className="about-hero-overlay"></div>
                </div>
                <div className="container about-hero-content">
                    <h1 className="about-title animate-float">
                        About <span className="text-gradient">HavenBook</span>
                    </h1>
                    <p className="about-subtitle">
                        Redefining the way you discover and book your perfect stay.
                    </p>
                </div>
            </section>

            {/* Main Content Sections */}
            <section className="about-content container">

                {/* Description */}
                <div className="info-card glass-card fade-in-up">
                    <div className="card-icon-wrapper">
                        <Info className="card-icon" size={28} />
                    </div>
                    <h2>Our Platform</h2>
                    <p>
                        HavenBook is a modern, comprehensive hotel booking platform designed to connect travelers with extraordinary accommodations worldwide.
                        Whether you're looking for a luxury villa, a cozy cabin, or a convenient city apartment, our platform makes it effortless to search, compare, and reserve your ideal stay.
                        We prioritize user experience, offering a seamless booking flow, advanced filtering, and secure payment processing.
                    </p>
                </div>

                {/* Affiliation CTA Section */}
                <div className="info-card affiliation-card glass-card fade-in-up">
                    <div className="card-icon-wrapper secondary">
                        <Building2 className="card-icon" size={28} />
                    </div>
                    <h2>Grow Your Business with Us</h2>
                    <p className="mb-8">
                        Do you want to be affiliated with the system so that the users/consumers/customers are aware that you are open for hotel booking? Join Us so that the customers can book to your hotel.
                    </p>
                    <div className="cta-action-box">
                        <button className="btn btn-primary btn-lg cta-btn" onClick={() => navigate('/login?redirect=admin')}>
                            Join Now <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Tech Stack */}
                <div className="info-card glass-card fade-in-up delay-1">
                    <div className="card-icon-wrapper">
                        <Code2 className="card-icon" size={28} />
                    </div>
                    <h2>Technology Stack</h2>
                    <div className="tech-stack-grid">
                        <div className="tech-item">
                            <h3>Frontend</h3>
                            <ul>
                                <li>React 19</li>
                                <li>Vite</li>
                                <li>Zustand (State Management)</li>
                                <li>Axios</li>
                                <li>React Router</li>
                                <li>Vanilla CSS (Custom Glassmorphism Design)</li>
                            </ul>
                        </div>
                        <div className="tech-item">
                            <h3>Backend</h3>
                            <ul>
                                <li>ASP.NET Core Web API</li>
                                <li>Entity Framework Core</li>
                                <li>Clean Architecture (N-Tier)</li>
                                <li>JWT Authentication</li>
                                <li>SQL Server Database</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Developer & Contact Info */}
                <div className="contact-grid">
                    <div className="info-card glass-card fade-in-up delay-2">
                        <div className="card-icon-wrapper">
                            <User className="card-icon" size={28} />
                        </div>
                        <h2>Developer Information</h2>
                        <p className="developer-name"><strong>Designed & Developed by:</strong> MSU-Wone</p>
                        <p>Passionate about crafting scalable backend architectures and beautiful, responsive web interfaces.</p>
                    </div>

                    <div className="info-card glass-card fade-in-up delay-3">
                        <div className="card-icon-wrapper contact-wrapper">
                            <Mail className="card-icon text-primary" size={24} />
                            <Phone className="card-icon text-secondary" size={24} />
                        </div>
                        <h2>Contact Us</h2>
                        <ul className="contact-list">
                            <li>
                                <Mail size={18} className="text-gray" />
                                <span>support@havenbook.com</span>
                            </li>
                            <li>
                                <Phone size={18} className="text-gray" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                        </ul>
                    </div>
                </div>

            </section>
        </div>
    );
};

export default About;
