import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // In a real app, you would validate credentials against a database
        if (email === 'demo@pureflow.com' && password === 'password') {
            // Create a mock token - in a real app you'd sign a JWT
            const token = 'mock_jwt_token';

            // Create response with cookie
            const response = NextResponse.json(
                {
                    success: true,
                    message: 'Authentication successful',
                    user: {
                        id: '1',
                        name: 'Demo User',
                        email: 'demo@pureflow.com',
                        role: 'MARKETING'
                    }
                },
                { status: 200 }
            );

            // Set cookie
            response.cookies.set({
                name: 'auth_token',
                value: token,
                httpOnly: true,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });

            return response;
        }

        // Invalid credentials
        return NextResponse.json(
            { success: false, message: 'Invalid email or password' },
            { status: 401 }
        );
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication failed' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    // Get current user from token
    const token = request.headers.get('cookie')?.split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

    if (!token) {
        return NextResponse.json(
            { success: false, message: 'Not authenticated' },
            { status: 401 }
        );
    }

    // In a real app, you would validate the token and fetch user data
    return NextResponse.json({
        success: true,
        user: {
            id: '1',
            name: 'Demo User',
            email: 'demo@pureflow.com',
            role: 'MARKETING'
        }
    });
}

export async function DELETE(request: Request) {
    // Logout - clear token
    const response = NextResponse.json(
        { success: true, message: 'Logged out successfully' },
        { status: 200 }
    );

    response.cookies.delete('auth_token');

    return response;
}