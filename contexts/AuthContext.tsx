'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/models';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: () => { },
    isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on component mount
        const checkAuth = async () => {
            try {
                // In a real app, this would verify the JWT token and fetch user data
                const token = localStorage.getItem('auth_token');

                if (token) {
                    // For demo purposes, we'll create a mock user
                    // In a real app, you would validate the token with your backend
                    const mockUser: User = {
                        id: '1',
                        email: 'user@pureflow.com',
                        name: 'Demo User',
                        role: UserRole.MARKETING,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };

                    setUser(mockUser);
                }
            } catch (error) {
                console.error('Authentication error:', error);
                localStorage.removeItem('auth_token');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            // Call the actual API endpoint
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }

            setUser(data.user);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};