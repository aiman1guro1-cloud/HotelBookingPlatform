import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import About from './pages/About';
import Hotels from './pages/Hotels';
import HotelDetail from './pages/HotelDetail';
import AccountSettings from './pages/AccountSettings';

// Protected Pages
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    {/* Public Routes */}
                    <Route index element={<Home />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password" element={<ResetPassword />} />
                    <Route path="about" element={<About />} />
                    <Route path="hotels" element={<Hotels />} />
                    <Route path="hotels/:id" element={<HotelDetail />} />

                    {/* Protected: Authenticated Users */}
                    <Route
                        path="checkout"
                        element={
                            <PrivateRoute>
                                <Checkout />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="settings"
                        element={
                            <PrivateRoute>
                                <AccountSettings />
                            </PrivateRoute>
                        }
                    />

                    {/* Protected: Admins Only */}
                    <Route
                        path="admin"
                        element={
                            <PrivateRoute role="Admin">
                                <AdminDashboard />
                            </PrivateRoute>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;