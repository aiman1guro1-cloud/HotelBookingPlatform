import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';

// Helper: check if a JWT token is valid (exists and not expired)
const isTokenValid = (token) => {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Check expiry (exp is in seconds, Date.now() is in milliseconds)
        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
};

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: async (email, password) => {
                const response = await apiClient.post('/Auth/login', { email, password });
                // Backend returns a flat object: { id, email, firstName, lastName, token, role, expiration }
                const { token, role, id, firstName, lastName, ...rest } = response.data;
                const user = { id, email: rest.email ?? email, firstName, lastName, role };
                set({ user, token, isAuthenticated: true });
                localStorage.setItem('token', token);
            },

            register: async (userData) => {
                // e.g. { firstName, lastName, email, password, confirmPassword }
                const response = await apiClient.post('/Auth/register', userData);
                // Also map flat response for register-then-auto-login scenarios
                const { token, role, id, firstName, lastName, ...rest } = response.data;
                const user = { id, email: rest.email, firstName, lastName, role };
                return { user, token };
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                localStorage.removeItem('token');
            },

            // Verify current auth state is actually valid
            verifyAuth: () => {
                const { token } = get();
                const storedToken = localStorage.getItem('token');
                const activeToken = storedToken || token;

                if (!isTokenValid(activeToken)) {
                    // Token missing or expired — clear auth state
                    set({ user: null, token: null, isAuthenticated: false });
                    localStorage.removeItem('token');
                    return false;
                }

                // Ensure localStorage and zustand are in sync
                if (!storedToken && token) {
                    localStorage.setItem('token', token);
                } else if (storedToken && !token) {
                    set({ token: storedToken });
                }
                return true;
            },

            // Used if we need to hydrate the user data based on just having a valid token
            fetchProfile: async () => {
                try {
                    const response = await apiClient.get('/Auth/me');
                    // Map the response from GetMe
                    const { claims } = response.data;
                    const roleClaim = claims.find(c => c.type === 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role' || c.type === 'role');
                    const emailClaim = claims.find(c => c.type === 'http://schemas.microsoft.com/ws/2008/06/identity/claims/emailaddress');
                    const idClaim = claims.find(c => c.type === 'http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier');
                    
                    const user = {
                        id: idClaim?.value,
                        email: emailClaim?.value,
                        role: roleClaim?.value
                    };
                    
                    set({ user, isAuthenticated: true });
                } catch (err) {
                    console.error(err);
                    set({ user: null, token: null, isAuthenticated: false });
                    localStorage.removeItem('token');
                }
            }
        }),
        {
            name: 'auth-storage', // name of item in storage (must be unique)
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
            onRehydrateStorage: () => (state) => {
                // After zustand rehydrates persisted data, verify the token is still valid
                if (state?.isAuthenticated) {
                    // Use setTimeout to ensure store is ready
                    setTimeout(() => state.verifyAuth(), 0);
                }
            },
        }
    )
);

export default useAuthStore;
