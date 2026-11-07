export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { deleteUserFromDb, getDbState } from '@/lib/serverDb';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('id');
    const callerId = searchParams.get('callerId') || undefined;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const result = deleteUserFromDb(userId, callerId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete user' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `User ${result.user?.name || userId} has been permanently deleted.`,
        deletedUserId: userId,
        user: result.user,
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('API admin/users DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || body.id;
    const callerId = body.callerId || undefined;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const result = deleteUserFromDb(userId, callerId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete user' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `User ${result.user?.name || userId} has been permanently deleted.`,
        deletedUserId: userId,
        user: result.user,
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('API admin/users POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function GET() {
  try {
    const state = getDbState();
    return NextResponse.json(
      {
        success: true,
        users: state.users,
        deletedUserIds: state.deletedUserIds || [],
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('API admin/users GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
