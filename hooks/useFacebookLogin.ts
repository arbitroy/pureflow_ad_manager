'use client';

import { useState, useCallback } from 'react';

export interface FacebookUser {
    id: string;
    name: string;
    email: string;
    picture?: {
        data: {
            url: string;
        };
    };
}

export interface FacebookAuthResponse {
    accessToken: string;
    expiresIn: string;
    signedRequest: string;
    userID: string;
}

export interface FacebookLoginResponse {
    status: 'connected' | 'not_authorized' | 'unknown';
    authResponse?: FacebookAuthResponse;
}

interface UseFacebookLoginReturn {
    isLoading: boolean;
    error: string | null;
    login: () => Promise<{ user: FacebookUser; accessToken: string } | null>;
    logout: () => Promise<void>;
    checkLoginStatus: () => Promise<FacebookLoginResponse | null>;
    getUser: (accessToken?: string) => Promise<FacebookUser | null>;
}

const useFacebookLogin = (): UseFacebookLoginReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const waitForFB = useCallback((): Promise<void> => {
        return new Promise((resolve) => {
            if (window.FB) {
                resolve();
                return;
            }

            const checkFB = () => {
                if (window.FB) {
                    resolve();
                } else {
                    setTimeout(checkFB, 100);
                }
            };

            checkFB();
        });
    }, []);

    const checkLoginStatus = useCallback(async (): Promise<FacebookLoginResponse | null> => {
        try {
            await waitForFB();

            return new Promise((resolve) => {
                window.FB.getLoginStatus((response) => {
                    resolve(response);
                });
            });
        } catch (err) {
            console.error('Error checking Facebook login status:', err);
            setError('Failed to check login status');
            return null;
        }
    }, [waitForFB]);

    const getUser = useCallback(async (accessToken?: string): Promise<FacebookUser | null> => {
        try {
            await waitForFB();

            return new Promise((resolve, reject) => {
                const fields = 'id,name,email,picture.width(200).height(200)';

                window.FB.api('/me', { fields }, (response) => {
                    if (response && !response.error) {
                        resolve(response);
                    } else {
                        reject(new Error(response?.error?.message || 'Failed to get user data'));
                    }
                });
            });
        } catch (err) {
            console.error('Error getting Facebook user:', err);
            setError('Failed to get user information');
            return null;
        }
    }, [waitForFB]);

    const login = useCallback(async (): Promise<{ user: FacebookUser; accessToken: string } | null> => {
        try {
            setIsLoading(true);
            setError(null);

            await waitForFB();

            // Request login with required permissions
            const loginResponse: FacebookLoginResponse = await new Promise((resolve) => {
                window.FB.login((response) => {
                    resolve(response);
                }, {
                    scope: 'public_profile,email,ads_management,ads_read,business_management,pages_manage_ads,pages_read_engagement'
                });
            });

            if (loginResponse.status === 'connected' && loginResponse.authResponse) {
                // Get user information
                const user = await getUser(loginResponse.authResponse.accessToken);

                if (user) {
                    return {
                        user,
                        accessToken: loginResponse.authResponse.accessToken
                    };
                } else {
                    throw new Error('Failed to retrieve user information');
                }
            } else {
                throw new Error('Facebook login was cancelled or failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Facebook login failed';
            console.error('Facebook login error:', err);
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [waitForFB, getUser]);

    const logout = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            await waitForFB();

            return new Promise((resolve) => {
                window.FB.logout(() => {
                    resolve();
                });
            });
        } catch (err) {
            console.error('Facebook logout error:', err);
            setError('Failed to logout from Facebook');
        } finally {
            setIsLoading(false);
        }
    }, [waitForFB]);

    return {
        isLoading,
        error,
        login,
        logout,
        checkLoginStatus,
        getUser
    };
};

export default useFacebookLogin;