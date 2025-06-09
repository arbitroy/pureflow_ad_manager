'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        fbAsyncInit: () => void;
        FB: {
            init: (params: {
                appId: string;
                cookie?: boolean;
                xfbml?: boolean;
                version: string;
            }) => void;
            login: (
                callback: (response: any) => void,
                options?: { scope: string }
            ) => void;
            logout: (callback: (response: any) => void) => void;
            getLoginStatus: (callback: (response: any) => void) => void;
            api: (
                path: string,
                params: any,
                callback: (response: any) => void
            ) => void;
            AppEvents: {
                logPageView: () => void;
            };
        };
    }
}

interface FacebookSDKProps {
    onInit?: () => void;
}

const FacebookSDK: React.FC<FacebookSDKProps> = ({ onInit }) => {
    useEffect(() => {
        // Only initialize once
        if (window.FB) {
            onInit?.();
            return;
        }

        // Initialize Facebook SDK
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
                cookie: true, // Enable cookies to allow the server to access the session
                xfbml: true, // Parse social plugins on this webpage
                version: 'v23.0' // Use latest Graph API version
            });

            // Log page view for analytics
            window.FB.AppEvents.logPageView();

            // Callback when SDK is ready
            onInit?.();
        };

        // Load Facebook SDK asynchronously
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';

        // Insert script after first script tag or in head
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript);
        } else {
            document.head.appendChild(script);
        }

        // Cleanup function
        return () => {
            // Remove the script when component unmounts
            const fbScript = document.getElementById('facebook-jssdk');
            if (fbScript) {
                fbScript.remove();
            }
        };
    }, [onInit]);

    return null; // This is a utility component that doesn't render anything
};

export default FacebookSDK;