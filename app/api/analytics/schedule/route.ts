// app/api/analytics/schedule/route.ts
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('auth_token')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const tokenData = verifyAccessToken(accessToken);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            name,
            frequency, // 'daily', 'weekly', 'monthly'
            recipients,
            format, // 'csv', 'pdf'
            includeCharts = false,
            filters = {},
            timezone = 'UTC'
        } = body;

        // Validate required fields
        if (!name || !frequency || !recipients || recipients.length === 0 || !format) {
            return NextResponse.json(
                { success: false, message: 'Name, frequency, recipients, and format are required' },
                { status: 400 }
            );
        }

        // Validate frequency
        if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
            return NextResponse.json(
                { success: false, message: 'Frequency must be daily, weekly, or monthly' },
                { status: 400 }
            );
        }

        // Validate format
        if (!['csv', 'pdf'].includes(format)) {
            return NextResponse.json(
                { success: false, message: 'Format must be csv or pdf' },
                { status: 400 }
            );
        }

        // Generate schedule ID
        const scheduleId = uuidv4();

        // Calculate next run time based on frequency
        const nextRunTime = calculateNextRunTime(frequency, timezone);

        // Store scheduled report in database
        await pool.query(
            `INSERT INTO scheduled_reports 
            (id, user_id, name, frequency, recipients, format, include_charts, filters, timezone, next_run, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                scheduleId,
                tokenData.userId,
                name,
                frequency,
                JSON.stringify(recipients),
                format,
                includeCharts,
                JSON.stringify(filters),
                timezone,
                nextRunTime
            ]
        );

        return NextResponse.json({
            success: true,
            message: 'Report scheduled successfully',
            data: {
                scheduleId,
                nextRunTime: nextRunTime.toISOString()
            }
        });

    } catch (error) {
        console.error('Error scheduling report:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to schedule report' },
            { status: 500 }
        );
    }
}

// GET scheduled reports
export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('auth_token')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const tokenData = verifyAccessToken(accessToken);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Get user's scheduled reports
        const [rows] = await pool.query(
            `SELECT 
                id, name, frequency, recipients, format, include_charts, 
                filters, timezone, next_run, is_active, created_at, updated_at
            FROM scheduled_reports 
            WHERE user_id = ? 
            ORDER BY created_at DESC`,
            [tokenData.userId]
        );

        const scheduledReports = (rows as any[]).map(report => ({
            id: report.id,
            name: report.name,
            frequency: report.frequency,
            recipients: JSON.parse(report.recipients),
            format: report.format,
            includeCharts: report.include_charts,
            filters: JSON.parse(report.filters),
            timezone: report.timezone,
            nextRun: report.next_run,
            isActive: report.is_active,
            createdAt: report.created_at,
            updatedAt: report.updated_at
        }));

        return NextResponse.json({
            success: true,
            data: scheduledReports
        });

    } catch (error) {
        console.error('Error fetching scheduled reports:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch scheduled reports' },
            { status: 500 }
        );
    }
}

// Calculate next run time based on frequency
function calculateNextRunTime(frequency: string, timezone: string): Date {
    const now = new Date();
    let nextRun = new Date(now);

    switch (frequency) {
        case 'daily':
            nextRun.setDate(now.getDate() + 1);
            nextRun.setHours(9, 0, 0, 0); // 9 AM
            break;
        case 'weekly':
            // Next Monday at 9 AM
            const daysUntilMonday = (7 - now.getDay() + 1) % 7 || 7;
            nextRun.setDate(now.getDate() + daysUntilMonday);
            nextRun.setHours(9, 0, 0, 0);
            break;
        case 'monthly':
            // First day of next month at 9 AM
            nextRun.setMonth(now.getMonth() + 1, 1);
            nextRun.setHours(9, 0, 0, 0);
            break;
    }

    return nextRun;
}

// Update scheduled report
export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('auth_token')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const tokenData = verifyAccessToken(accessToken);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { scheduleId, ...updateData } = body;

        if (!scheduleId) {
            return NextResponse.json(
                { success: false, message: 'Schedule ID is required' },
                { status: 400 }
            );
        }

        // Check if schedule exists and belongs to user
        const [existing] = await pool.query(
            'SELECT id FROM scheduled_reports WHERE id = ? AND user_id = ?',
            [scheduleId, tokenData.userId]
        );

        if ((existing as any[]).length === 0) {
            return NextResponse.json(
                { success: false, message: 'Scheduled report not found' },
                { status: 404 }
            );
        }

        // Build update query
        const updateFields = [];
        const updateValues = [];

        Object.entries(updateData).forEach(([key, value]) => {
            switch (key) {
                case 'name':
                case 'frequency':
                case 'format':
                case 'timezone':
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                    break;
                case 'recipients':
                case 'filters':
                    updateFields.push(`${key} = ?`);
                    updateValues.push(JSON.stringify(value));
                    break;
                case 'includeCharts':
                    updateFields.push('include_charts = ?');
                    updateValues.push(value);
                    break;
                case 'isActive':
                    updateFields.push('is_active = ?');
                    updateValues.push(value);
                    break;
            }
        });

        if (updateFields.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Add updated_at
        updateFields.push('updated_at = NOW()');

        // If frequency changed, recalculate next run time
        if (updateData.frequency) {
            const nextRunTime = calculateNextRunTime(updateData.frequency, updateData.timezone || 'UTC');
            updateFields.push('next_run = ?');
            updateValues.push(nextRunTime);
        }

        updateValues.push(scheduleId);

        // Execute update
        await pool.query(
            `UPDATE scheduled_reports SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        return NextResponse.json({
            success: true,
            message: 'Scheduled report updated successfully'
        });

    } catch (error) {
        console.error('Error updating scheduled report:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update scheduled report' },
            { status: 500 }
        );
    }
}

// Delete scheduled report
export async function DELETE(request: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('auth_token')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const tokenData = verifyAccessToken(accessToken);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const scheduleId = searchParams.get('id');

        if (!scheduleId) {
            return NextResponse.json(
                { success: false, message: 'Schedule ID is required' },
                { status: 400 }
            );
        }

        // Check if schedule exists and belongs to user
        const [existing] = await pool.query(
            'SELECT id FROM scheduled_reports WHERE id = ? AND user_id = ?',
            [scheduleId, tokenData.userId]
        );

        if ((existing as any[]).length === 0) {
            return NextResponse.json(
                { success: false, message: 'Scheduled report not found' },
                { status: 404 }
            );
        }

        // Delete the scheduled report
        await pool.query(
            'DELETE FROM scheduled_reports WHERE id = ?',
            [scheduleId]
        );

        return NextResponse.json({
            success: true,
            message: 'Scheduled report deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting scheduled report:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete scheduled report' },
            { status: 500 }
        );
    }
}