import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import apiClient from '../services/apiClient';
import './ForgotPassword.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: searchParams.get('email') || '',
        token: searchParams.get('token') || '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmNewPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await apiClient.post('/Auth/reset-password', {
                email: form.email,
                token: form.token,
                newPassword: form.newPassword,
                confirmNewPassword: form.confirmNewPassword,
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The token may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-container glass-card animate-fade-in fp-container" style={{ textAlign: 'center' }}>
                    <div className="token-success-icon"><CheckCircle2 size={56} color="#10B981" /></div>
                    <h2 style={{ marginTop: '1rem' }}>Password Reset!</h2>
                    <p style={{ color: 'var(--gray)' }}>Your password has been updated successfully.<br />Redirecting you to login...</p>
                    <Link to="/login" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container glass-card animate-fade-in fp-container">
                <Link to="/forgot-password" className="back-link">
                    <ArrowLeft size={16} /> Back
                </Link>

                <div className="auth-header">
                    <div className="fp-icon"><ShieldCheck size={32} /></div>
                    <h2>Reset Password</h2>
                    <p>Enter the token you received and choose a new password.</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="input-field"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                            id="reset-email-input"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Reset Token</label>
                        <input
                            type="text"
                            name="token"
                            className="input-field token-input"
                            placeholder="Paste your reset token here"
                            value={form.token}
                            onChange={handleChange}
                            required
                            id="reset-token-input"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">New Password</label>
                        <div className="input-with-icon">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                name="newPassword"
                                className="input-field"
                                placeholder="Minimum 6 characters"
                                value={form.newPassword}
                                onChange={handleChange}
                                required
                                minLength={6}
                                id="new-password-input"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Confirm New Password</label>
                        <div className="input-with-icon">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                name="confirmNewPassword"
                                className="input-field"
                                placeholder="Repeat your new password"
                                value={form.confirmNewPassword}
                                onChange={handleChange}
                                required
                                minLength={6}
                                id="confirm-password-input"
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading} id="reset-password-submit-btn">
                        {loading ? <span className="spinner"></span> : <><ShieldCheck size={18} /> Reset Password</>}
                    </button>
                </form>

                <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                    <p>Remembered your password? <Link to="/login" className="text-primary">Sign in</Link></p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
