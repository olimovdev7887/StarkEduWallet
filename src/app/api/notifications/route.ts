export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDbState, getAllAdminIds } from '@/lib/serverDb';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    const state = getDbState();
    const adminIds = getAllAdminIds(state.users);

    let messages = state.messages || [];

    // If an adminId is passed and is one of the admins, filter or return messages targeted at admins
    if (adminId) {
      messages = messages.filter((m) => {
        if (!m.targetAdminIds || m.targetAdminIds.length === 0) return true;
        return m.targetAdminIds.includes(adminId) || adminIds.includes(adminId);
      });
    }

    return NextResponse.json(
      {
        success: true,
        notifications: messages,
        messages,
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
