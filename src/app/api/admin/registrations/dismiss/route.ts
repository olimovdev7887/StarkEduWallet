export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { handleRegistrationActionInDb } from '@/lib/serverDb';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, notificationId, adminId, adminName } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const result = handleRegistrationActionInDb(
      userId,
      'dismiss',
      notificationId,
      adminId,
      adminName
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400, headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        action: 'dismiss',
        user: result.user,
        notification: result.notification,
        alreadyHandled: result.alreadyHandled || false,
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('Dismiss registration API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
