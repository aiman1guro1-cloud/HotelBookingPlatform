import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, CreditCard, Shield, Plus, Trash2, Camera, Save, Zap } from 'lucide-react';
import { getProfile, updateProfile, getPaymentMethods, addPaymentMethod, deletePaymentMethod } from '../services/userService';
import './AccountSettings.css';

const AccountSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [profile, setProfile] = useState({
        firstName: '', lastName: '', email: '', phoneNumber: '',
        address: '', city: '', country: '', postalCode: '', profileImageUrl: ''
    });

    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showAddCard, setShowAddCard] = useState(false);
    const [newCard, setNewCard] = useState({
        cardHolderName: '', cardNumberMasked: '', expiryDate: '', provider: 'Visa', isDefault: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profileRes, paymentRes] = await Promise.all([
                getProfile(),
                getPaymentMethods()
            ]);
            setProfile(profileRes.data);
            setPaymentMethods(paymentRes.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load account information.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await updateProfile(profile);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            console.error(err);
            setError('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        try {
            // In a real app, you'd use Stripe Elements here to get a paymentMethodId
            const mockId = 'pm_' + Math.random().toString(36).substr(2, 9);
            await addPaymentMethod({ ...newCard, stripePaymentMethodId: mockId });
            setShowAddCard(false);
            setNewCard({ cardHolderName: '', cardNumberMasked: '', expiryDate: '', provider: 'Visa', isDefault: false });
            loadData();
            setSuccess('Payment method added!');
        } catch (err) {
            console.error(err);
            setError('Failed to add payment method.');
        }
    };

    const handleDeleteCard = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payment method?')) return;
        try {
            await deletePaymentMethod(id);
            loadData();
            setSuccess('Payment method deleted.');
        } catch (err) {
            console.error(err);
            setError('Failed to delete payment method.');
        }
    };

    if (loading) return <div className="loading-state">Loading your account...</div>;

    return (
        <div className="account-settings-page container animate-fade-in">
            <div className="settings-header">
                <h1 className="text-gradient">Account Settings</h1>
                <p>Manage your profile, preferences, and payment methods.</p>
            </div>

            <div className="settings-layout">
                {/* Sidebar Tabs */}
                <aside className="settings-sidebar">
                    <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <User size={18} /> Profile Information
                    </button>
                    <button className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>
                        <CreditCard size={18} /> Payment Methods
                    </button>
                    <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                        <Shield size={18} /> Security & Privacy
                    </button>
                </aside>

                {/* Content Area */}
                <main className="settings-content glass-card">
                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {activeTab === 'profile' && (
                        <form className="profile-form" onSubmit={handleSaveProfile}>
                            <div className="avatar-section">
                                <div className="avatar-preview">
                                    {profile.profileImageUrl ? (
                                        <img src={profile.profileImageUrl} alt="Avatar" />
                                    ) : (
                                        <div className="avatar-placeholder">{profile.firstName[0]}{profile.lastName[0]}</div>
                                    )}
                                    <label className="avatar-upload-btn">
                                        <Camera size={16} />
                                        <input type="file" hidden accept="image/*" />
                                    </label>
                                </div>
                                <div className="avatar-info">
                                    <h3>Your Avatar</h3>
                                    <p>Click the camera icon to upload a new photo.</p>
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="input-group">
                                    <label className="input-label">First Name</label>
                                    <input className="input-field" name="firstName" value={profile.firstName} onChange={handleProfileChange} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Last Name</label>
                                    <input className="input-field" name="lastName" value={profile.lastName} onChange={handleProfileChange} required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label"><Mail size={14} /> Email Address</label>
                                <input className="input-field" type="email" value={profile.email} disabled />
                                <small>Email cannot be changed.</small>
                            </div>

                            <div className="input-group">
                                <label className="input-label"><Phone size={14} /> Phone Number</label>
                                <input className="input-field" name="phoneNumber" value={profile.phoneNumber || ''} onChange={handleProfileChange} placeholder="+1 (555) 000-0000" />
                            </div>

                            <div className="input-group">
                                <label className="input-label"><MapPin size={14} /> Address</label>
                                <input className="input-field" name="address" value={profile.address || ''} onChange={handleProfileChange} placeholder="123 Street Name" />
                            </div>

                            <div className="form-grid-3">
                                <div className="input-group">
                                    <label className="input-label">City</label>
                                    <input className="input-field" name="city" value={profile.city || ''} onChange={handleProfileChange} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Country</label>
                                    <input className="input-field" name="country" value={profile.country || ''} onChange={handleProfileChange} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Postal Code</label>
                                    <input className="input-field" name="postalCode" value={profile.postalCode || ''} onChange={handleProfileChange} />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-secondary" disabled={saving}>
                                <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'payment' && (
                        <div className="payment-management">
                            <div className="section-header">
                                <h2>Stored Payment Methods</h2>
                                <button className="btn btn-outline btn-sm" onClick={() => setShowAddCard(!showAddCard)}>
                                    <Plus size={16} /> Add Card
                                </button>
                            </div>

                            {showAddCard && (
                                <form className="add-card-form animate-slide-down" onSubmit={handleAddCard}>
                                    <div className="input-group">
                                        <label className="input-label">Cardholder Name</label>
                                        <input className="input-field" value={newCard.cardHolderName} onChange={e => setNewCard({...newCard, cardHolderName: e.target.value})} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Card Number (Last 4 digits for demo)</label>
                                        <input className="input-field" placeholder="**** **** **** 1234" value={newCard.cardNumberMasked} onChange={e => setNewCard({...newCard, cardNumberMasked: e.target.value})} required />
                                    </div>
                                    <div className="form-grid-2">
                                        <div className="input-group">
                                            <label className="input-label">Expiry (MM/YY)</label>
                                            <input className="input-field" placeholder="12/25" value={newCard.expiryDate} onChange={e => setNewCard({...newCard, expiryDate: e.target.value})} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Provider</label>
                                            <select className="input-field" value={newCard.provider} onChange={e => setNewCard({...newCard, provider: e.target.value})}>
                                                <option>Visa</option>
                                                <option>MasterCard</option>
                                                <option>Amex</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="btn btn-ghost" onClick={() => setShowAddCard(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-secondary">Add Payment Method</button>
                                    </div>
                                </form>
                            )}

                            <div className="payment-methods-list">
                                {paymentMethods.length === 0 ? (
                                    <div className="empty-state">No payment methods stored.</div>
                                ) : (
                                    paymentMethods.map(m => (
                                        <div key={m.id} className={`payment-method-item ${m.isDefault ? 'is-default' : ''}`}>
                                            <div className="method-icon">💳</div>
                                            <div className="method-details">
                                                <div className="method-main">
                                                    <strong>{m.provider}</strong> ending in {m.cardNumberMasked.slice(-4)}
                                                    {m.isDefault && <span className="default-badge">Default</span>}
                                                </div>
                                                <div className="method-sub">{m.cardHolderName} · Exp {m.expiryDate}</div>
                                            </div>
                                            <button className="delete-method-btn" onClick={() => handleDeleteCard(m.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="billing-history-preview">
                                <h3>Recent Billing History</h3>
                                <p className="text-muted">View your full billing history and invoices in the <a href="/billing">Billing Section</a>.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="security-settings">
                            <h2>Security Settings</h2>
                            <p className="text-muted">Manage your password and account security options.</p>
                            <div className="security-action">
                                <div>
                                    <strong>Change Password</strong>
                                    <p>Update your password to keep your account secure.</p>
                                </div>
                                <button className="btn btn-outline btn-sm">Change Password</button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AccountSettings;
