import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const login = useAuthStore(state => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            if (err.code === 'ERR_NETWORK') {
                setError('Unable to connect to the server. Please check if the backend is running.');
            } else {
                setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container glass-card animate-fade-in">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Login to manage your bookings and explore new destinations.</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <div className="input-with-icon">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                className="input-field"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="label-flex">
                            <label className="input-label">Password</label>
                            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                        </div>
                        <div className="input-with-icon">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
                        {isLoading ? <span className="spinner"></span> : <><LogIn size={20} /> Login</>}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/register" className="text-primary">Sign up</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
