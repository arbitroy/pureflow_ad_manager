
// This file configures theme colors for the PURE FLOW application

export const PURE_FLOW_COLORS = {
    primary: '#3e91ff',       // Blue
    secondary: '#ff762e',     // Orange/Red
    darkBackground: '#121025', // Dark navy/purple
    lightBackground: '#1a192c', // Slightly lighter navy/purple
    textPrimary: '#ffffff',    // White text for contrast
}

// Extend the default next-themes types
declare module "next-themes" {
    interface ThemeProviderProps {
        themes: string[];
    }
}