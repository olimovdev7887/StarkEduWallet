export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { registerUserInDb } from '@/lib/serverDb';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const result = registerUserInDb(name, email, password, role || 'seller');

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'exists' ? 409 : 400, headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: result.user,
        notification: result.notification,
        status: 'pending',
      },
      { status: 201, headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
