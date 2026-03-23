import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const register = useAuthStore(state => state.register);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            });
            navigate('/login');
        } catch (err) {
            if (err.code === 'ERR_NETWORK') {
                setError('Unable to connect to the server. Please check if the backend is running.');
            } else {
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container glass-card animate-fade-in">
                <div className="auth-header">
                    <h2>Create Account</h2>
                    <p>Join HavenBook and start exploring the world's best stays.</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">

                    <div className="name-grid">
                        <div className="input-group">
                            <label className="input-label">First Name</label>
                            <div className="input-with-icon">
                                <User className="input-icon" size={18} />
                                <input
                                    type="text"
                                    name="firstName"
                                    className="input-field"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Last Name</label>
                            <div className="input-with-icon">
                                <User className="input-icon" size={18} />
                                <input
                                    type="text"
                                    name="lastName"
                                    className="input-field"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="input-group mt-4">
                        <label className="input-label">Email Address</label>
                        <div className="input-with-icon">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                name="email"
                                className="input-field"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group mt-4">
                        <label className="input-label">Password</label>
                        <div className="input-with-icon">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                name="password"
                                className="input-field"
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength="6"
                            />
                        </div>
                    </div>

                    <div className="input-group mt-4">
                        <label className="input-label">Confirm Password</label>
                        <div className="input-with-icon">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                name="confirmPassword"
                                className="input-field"
                                placeholder="Repeat password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
                        {isLoading ? <span className="spinner"></span> : <><UserPlus size={20} /> Sign Up</>}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login" className="text-primary">Login here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
