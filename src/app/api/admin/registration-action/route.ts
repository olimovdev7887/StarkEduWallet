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
    const { userId, action, notificationId, adminId, adminName } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'userId and action are required' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const normalizedAction: 'accept' | 'dismiss' =
      action === 'approve' || action === 'accept' ? 'accept' : 'dismiss';

    const result = handleRegistrationActionInDb(
      userId,
      normalizedAction,
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
        action: normalizedAction,
        user: result.user,
        notification: result.notification,
        alreadyHandled: result.alreadyHandled || false,
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('Registration action API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
