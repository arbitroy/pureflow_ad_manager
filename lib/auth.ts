import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db';
import { User, UserRole } from '@/types/models';
import { SignOptions } from 'jsonwebtoken';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// User object without password
export type SafeUser = Omit<User, 'password'>;

// Helper functions
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export function generateTokens(user: SafeUser, accessTokenExpiry = '1h') {
    // Create access token (JWT)
    const accessToken = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role
        },
        Buffer.from(JWT_SECRET), // Convert to Buffer
        { expiresIn: accessTokenExpiry } as SignOptions
    );

    // Create refresh token
    const refreshToken = uuidv4();
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7); // Default to 7 days

    return {
        accessToken,
        refreshToken,
        refreshExpiry
    };
}

export async function saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    const id = uuidv4();

    await pool.query(
        'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
        [id, userId, token, expiresAt]
    );

    return id;
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );

    const users = rows as any[];
    return users.length > 0 ? {
        id: users[0].id,
        email: users[0].email,
        password: users[0].password,
        name: users[0].name,
        role: users[0].role as UserRole,
        createdAt: new Date(users[0].created_at),
        updatedAt: new Date(users[0].updated_at)
    } : null;
}

export async function getUserById(id: string): Promise<SafeUser | null> {
    const [rows] = await pool.query(
        'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?',
        [id]
    );

    const users = rows as any[];
    return users.length > 0 ? {
        id: users[0].id,
        email: users[0].email,
        name: users[0].name,
        role: users[0].role as UserRole,
        createdAt: new Date(users[0].created_at),
        updatedAt: new Date(users[0].updated_at)
    } : null;
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
    const [rows] = await pool.query(
        'SELECT user_id FROM refresh_tokens WHERE token = ? AND expires_at > NOW() AND revoked = FALSE',
        [token]
    );

    const tokens = rows as any[];
    return tokens.length > 0 ? tokens[0].user_id : null;
}

export async function revokeRefreshToken(token: string): Promise<boolean> {
    const [result] = await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token = ?',
        [token]
    );

    const updateResult = result as any;
    return updateResult.affectedRows > 0;
}

export function verifyAccessToken(token: string): { userId: string; email: string; role: UserRole } | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            email: string;
            role: UserRole;
        };
        return decoded;
    } catch (error) {
        return null;
    }
}