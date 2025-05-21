'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/models';
import { useRouter } from 'next/navigation';

interface LoginOptions {
    rememberMe?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    initialized: boolean; // New flag to track initialization
    lastLogin: Date | null;
    login: (email: string, password: string, options?: LoginOptions) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
    isAuthenticated: boolean;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    initialized: false,
    lastLogin: null,
    login: async () => { },
    logout: async () => { },
    refreshToken: async () => false,
    isAuthenticated: false,
    error: null,
    clearError: () => { },
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastLogin, setLastLogin] = useState<Date | null>(null);
    const router = useRouter();

    const clearError = () => setError(null);

    // Check auth status on mount and set up refresh interval
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setLoading(true);
                const authResult = await fetchCurrentUser();
                if (authResult) {
                    setUser(authResult.user);
                    if (authResult.lastLogin) {
                        setLastLogin(new Date(authResult.lastLogin));
                    }
                }
            } catch (err) {
                console.error('Initial auth check failed:', err);
                // Silent failure for initial check
            } finally {
                setLoading(false);
                setInitialized(true); // Mark initialization as complete
            }
        };

        checkAuth();

        // Set up token refresh interval (every 15 minutes)
        const refreshInterval = setInterval(() => {
            if (user) {
                refreshToken().catch(console.error);
            }
        }, 15 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, []);


    // Fetch current user helper
    const fetchCurrentUser = async () => {
        const response = await fetch('/api/auth/me');
        if (!response.ok) return null;

        const data = await response.json();
        return data.success ? {
            user: data.user as User,
            lastLogin: data.lastLogin
        } : null;
    };

    // Token refresh function
    const refreshToken = async (): Promise<boolean> => {
        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid, log out the user
                    setUser(null);
                    return false;
                }
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            if (data.success) {
                setUser(data.user as User);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Token refresh failed:', err);
            return false;
        }
    };

    // Enhanced login function with remember me
    const login = async (email: string, password: string, options?: LoginOptions) => {
        clearError();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    rememberMe: options?.rememberMe
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Handle different error cases
                if (response.status === 401) {
                    setError('Invalid email or password');
                } else if (response.status === 403) {
                    setError('Your account has been locked. Please contact an administrator.');
                } else if (response.status === 429) {
                    setError('Too many login attempts. Please try again later.');
                } else {
                    setError(errorData.message || 'Login failed. Please try again.');
                }

                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            setUser(data.user as User);
            setLastLogin(new Date());
        } catch (err) {
            console.error('Login error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Enhanced logout function with redirection
    const logout = async () => {
        try {
            setLoading(true);
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
            setUser(null);
            setLastLogin(null);
            // Redirect to login page after logout
            router.push('/login');
        } catch (err) {
            console.error('Logout error:', err);
            setError('Logout failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                initialized,
                user,
                loading,
                lastLogin,
                login,
                logout,
                refreshToken,
                isAuthenticated: !!user,
                error,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};