export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDbFilePath } from '@/lib/serverDb';
import type { User, AppMessage } from '@/types';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const dbPath = getDbFilePath();

  try {
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8')) as Record<string, unknown>;
      if (key && data[key] !== undefined) {
        return NextResponse.json({ value: data[key] }, { headers: noCacheHeaders });
      }
    }
  } catch (error) {
    console.error("DB Read Error:", error);
  }

  return NextResponse.json({ value: null }, { headers: noCacheHeaders });
}

export async function POST(request: Request) {
  try {
    const { key, value } = (await request.json()) as { key: string; value: string | null };
    const dbPath = getDbFilePath();
    let data: Record<string, unknown> = {};

    if (fs.existsSync(dbPath)) {
      try {
        data = JSON.parse(fs.readFileSync(dbPath, 'utf-8')) as Record<string, unknown>;
      } catch {
        // ignore parse error
      }
    }

    if (value === null) {
      delete data[key];
    } else if (key === 'stark-edu-wallet-storage') {
      try {
        const incomingParsed = JSON.parse(value) as { state?: Record<string, unknown> };
        const incomingState = incomingParsed?.state || {};

        let existingState: Record<string, unknown> | null = null;
        if (typeof data['stark-edu-wallet-storage'] === 'string') {
          try {
            const existingParsed = JSON.parse(data['stark-edu-wallet-storage']) as { state?: Record<string, unknown> };
            existingState = existingParsed?.state || {};
          } catch {
            // ignore
          }
        }

        if (existingState && Array.isArray(existingState.users)) {
          // Merge users so that pending registrations in DB are never lost by stale client saves
          const incomingUsers: User[] = Array.isArray(incomingState.users) ? (incomingState.users as User[]) : [];
          const existingUsers: User[] = existingState.users as User[];

          const incomingUserMap = new Map<string, User>();
          incomingUsers.forEach((u) => incomingUserMap.set(u.id, u));

          const mergedUsers = [...incomingUsers];
          for (const exUser of existingUsers) {
            if (!incomingUserMap.has(exUser.id)) {
              // User exists in DB but not in incoming stale save: preserve them
              mergedUsers.push(exUser);
            } else {
              // If existing user in DB was updated to approved/rejected, preserve that authoritative status
              const incUser = incomingUserMap.get(exUser.id);
              if (incUser && (exUser.status === 'approved' || exUser.status === 'rejected')) {
                incUser.status = exUser.status;
                incUser.isApproved = exUser.status === 'approved';
              }
            }
          }
          incomingState.users = mergedUsers;

          // Merge messages so that DB notifications and 'handled' statuses are never wiped out
          const incomingMessages: AppMessage[] = Array.isArray(incomingState.messages) ? (incomingState.messages as AppMessage[]) : [];
          const existingMessages: AppMessage[] = Array.isArray(existingState.messages) ? (existingState.messages as AppMessage[]) : [];

          const incomingMsgMap = new Map<string, AppMessage>();
          incomingMessages.forEach((m) => incomingMsgMap.set(m.id, m));

          const mergedMessages = [...incomingMessages];
          for (const exMsg of existingMessages) {
            if (!incomingMsgMap.has(exMsg.id)) {
              mergedMessages.push(exMsg);
            } else {
              const incMsg = incomingMsgMap.get(exMsg.id);
              if (incMsg && exMsg.status === 'handled') {
                incMsg.status = 'handled';
                incMsg.actionTaken = exMsg.actionTaken || incMsg.actionTaken;
                incMsg.handledBy = exMsg.handledBy || incMsg.handledBy;
                incMsg.handledAt = exMsg.handledAt || incMsg.handledAt;
                incMsg.read = true;
              }
            }
          }
          incomingState.messages = mergedMessages;

          data[key] = JSON.stringify({ state: incomingState, version: 0 });
        } else {
          data[key] = value;
        }
      } catch {
        data[key] = value;
      }
    } else {
      data[key] = value;
    }

    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (writeErr: unknown) {
      const err = writeErr as { code?: string };
      if (err.code === 'EROFS' || process.env.VERCEL) {
        const tmpPath = path.join('/tmp', 'database.json');
        fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      } else {
        throw writeErr;
      }
    }
    return NextResponse.json({ success: true }, { headers: noCacheHeaders });
  } catch (error) {
    console.error("DB Write Error:", error);
    return NextResponse.json({ success: false }, { status: 500, headers: noCacheHeaders });
  }
}
