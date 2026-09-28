import fs from 'fs';
import path from 'path';
import { User, AppMessage, Role, RegistrationStatus } from '@/types';

const dbPath = path.join(process.cwd(), 'database.json');

export const SUPER_ADMIN_SEEDS: User[] = [
  {
    id: 'superadmin-001',
    name: 'Admin',
    email: 'admin@stark.edu',
    password: 'javohir123',
    role: 'admin',
    isSuperAdmin: true,
    status: 'approved',
    isApproved: true,
  },
  {
    id: 'superadmin-002',
    name: 'Muhammadjon',
    email: 'creator@stark.edu',
    password: '7887',
    role: 'admin',
    isSuperAdmin: true,
    status: 'approved',
    isApproved: true,
  },
];

export interface DbAppState {
  users: User[];
  books: any[];
  inventory: any[];
  wallet: any;
  salesHistory: any[];
  purchaseHistory: any[];
  debts: any[];
  categories: any[];
  activeSessions: string[];
  lastResetDate: string;
  cart: any;
  messages: AppMessage[];
}

export function getAllAdminIds(users: User[] = []): string[] {
  const ids = new Set<string>();
  // Both primary admin accounts are always targeted
  SUPER_ADMIN_SEEDS.forEach((s) => ids.add(s.id));
  users
    .filter((u) => u.role === 'admin')
    .forEach((u) => ids.add(u.id));
  return Array.from(ids);
}

export function getAllAdminEmails(users: User[] = []): string[] {
  const emails = new Set<string>();
  SUPER_ADMIN_SEEDS.forEach((s) => emails.add(s.email));
  users
    .filter((u) => u.role === 'admin')
    .forEach((u) => emails.add(u.email));
  return Array.from(emails);
}

export function getRawDatabase(): Record<string, any> {
  try {
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading raw database.json:', error);
  }
  return {};
}

export function getDbState(): DbAppState {
  const raw = getRawDatabase();
  const storageStr = raw['stark-edu-wallet-storage'];
  let parsedState: any = null;

  if (storageStr) {
    try {
      const parsed = JSON.parse(storageStr);
      parsedState = parsed.state || parsed;
    } catch (e) {
      console.error('Error parsing stark-edu-wallet-storage:', e);
    }
  }

  const existingUsers: User[] = parsedState?.users || [];

  // Normalize users: ensure super admin seeds exist and all users have status & isApproved
  const seedIds = new Set(SUPER_ADMIN_SEEDS.map((s) => s.id));
  const nonSeedUsers = existingUsers.filter((u) => !seedIds.has(u.id));

  const normalizedUsers: User[] = [
    ...SUPER_ADMIN_SEEDS,
    ...nonSeedUsers.map((u) => {
      const status: RegistrationStatus =
        u.status || (u.isApproved === false ? 'pending' : 'approved');
      return {
        ...u,
        status,
        isApproved: status === 'approved',
      };
    }),
  ];

  const adminIds = getAllAdminIds(normalizedUsers);
  const adminEmails = getAllAdminEmails(normalizedUsers);

  // Normalize messages
  let existingMessages: AppMessage[] = parsedState?.messages || [];
  
  // Ensure every pending user has an active registration notification targeted at both admin IDs
  const pendingUsers = normalizedUsers.filter((u) => u.status === 'pending');
  for (const pendingUser of pendingUsers) {
    const existingMsgIndex = existingMessages.findIndex(
      (m) =>
        m.type === 'registration' &&
        (m.userId === pendingUser.id || m.senderEmail === pendingUser.email)
    );

    if (existingMsgIndex === -1) {
      const newMsg: AppMessage = {
        id: `reg-notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: 'registration',
        title: 'New Account Registration',
        content: `New ${pendingUser.role || 'seller'} account registration request from ${pendingUser.name} (${pendingUser.email}). Action required: Accept or Dismiss.`,
        senderName: pendingUser.name,
        senderEmail: pendingUser.email,
        userId: pendingUser.id,
        date: new Date().toISOString(),
        read: false,
        status: 'pending',
        targetAdminIds: adminIds,
        targetEmails: adminEmails,
      };
      existingMessages = [newMsg, ...existingMessages];
    } else {
      // Ensure targetAdminIds includes both admin IDs
      const msg = existingMessages[existingMsgIndex];
      const mergedAdminIds = Array.from(
        new Set([...(msg.targetAdminIds || []), ...adminIds])
      );
      if (!msg.status) {
        msg.status = 'pending';
      }
      msg.targetAdminIds = mergedAdminIds;
    }
  }

  // Ensure notifications for approved or rejected users are marked handled
  const handledUserMap = new Map<string, RegistrationStatus>();
  normalizedUsers.forEach((u) => {
    if (u.status === 'approved' || u.status === 'rejected') {
      handledUserMap.set(u.id, u.status);
    }
  });

  existingMessages = existingMessages.map((m) => {
    if (m.type === 'registration' && m.userId && handledUserMap.has(m.userId)) {
      const userStatus = handledUserMap.get(m.userId)!;
      return {
        ...m,
        status: 'handled',
        actionTaken: m.actionTaken || (userStatus === 'approved' ? 'accepted' : 'dismissed'),
        read: true,
      };
    }
    return m;
  });

  return {
    users: normalizedUsers,
    books: parsedState?.books || [],
    inventory: parsedState?.inventory || [],
    wallet: parsedState?.wallet || { id: 'w1', balance: 0, total_debt: 0, purchase_cost: 0 },
    salesHistory: parsedState?.salesHistory || [],
    purchaseHistory: parsedState?.purchaseHistory || [],
    debts: parsedState?.debts || [],
    categories: parsedState?.categories || [],
    activeSessions: parsedState?.activeSessions || [],
    lastResetDate: parsedState?.lastResetDate || '',
    cart: parsedState?.cart || { entries: [] },
    messages: existingMessages,
  };
}

export function saveDbState(state: DbAppState): boolean {
  try {
    const raw = getRawDatabase();
    raw['stark-edu-wallet-storage'] = JSON.stringify({
      state,
      version: 0,
    });
    fs.writeFileSync(dbPath, JSON.stringify(raw, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving database state to database.json:', error);
    return false;
  }
}

export function registerUserInDb(
  name: string,
  email: string,
  password?: string,
  role: Role = 'seller'
): { success: boolean; user?: User; notification?: AppMessage; error?: string } {
  const state = getDbState();
  const normalizedEmail = email.trim().toLowerCase();

  // Super admin emails are reserved
  if (SUPER_ADMIN_SEEDS.some((s) => s.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'exists' };
  }

  // Check if active user already exists with this email
  const existingUser = state.users.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (existingUser && existingUser.status !== 'rejected') {
    return { success: false, error: 'exists' };
  }

  const userId = existingUser ? existingUser.id : Math.random().toString(36).substr(2, 9);
  const newUser: User = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    password: password || '',
    role: role,
    status: 'pending',
    isApproved: false,
  };

  const adminIds = getAllAdminIds(state.users);
  const adminEmails = getAllAdminEmails(state.users);

  const newNotification: AppMessage = {
    id: `reg-notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type: 'registration',
    title: 'New Account Registration',
    content: `New ${role} account registration request from ${newUser.name} (${newUser.email}). Action required: Accept or Dismiss.`,
    senderName: newUser.name,
    senderEmail: newUser.email,
    userId: newUser.id,
    date: new Date().toISOString(),
    read: false,
    status: 'pending',
    targetAdminIds: adminIds,
    targetEmails: adminEmails,
  };

  // Replace existing rejected user or append new user
  let updatedUsers: User[];
  if (existingUser) {
    updatedUsers = state.users.map((u) => (u.id === existingUser.id ? newUser : u));
  } else {
    updatedUsers = [...state.users, newUser];
  }

  // Prepend notification
  const updatedMessages = [newNotification, ...state.messages];

  state.users = updatedUsers;
  state.messages = updatedMessages;

  saveDbState(state);

  return { success: true, user: newUser, notification: newNotification };
}

export function handleRegistrationActionInDb(
  userId: string,
  action: 'accept' | 'dismiss',
  notificationId?: string,
  adminId?: string,
  adminName?: string
): {
  success: boolean;
  user?: User;
  notification?: AppMessage;
  alreadyHandled?: boolean;
  error?: string;
} {
  const state = getDbState();
  const targetUser = state.users.find((u) => u.id === userId);

  if (!targetUser) {
    return { success: false, error: 'User not found' };
  }

  const isAccept = action === 'accept';
  const targetStatus: RegistrationStatus = isAccept ? 'approved' : 'rejected';

  // Check if already in requested status
  if (targetUser.status === targetStatus) {
    const existingMsg = state.messages.find(
      (m) =>
        (notificationId && m.id === notificationId) ||
        (m.type === 'registration' && m.userId === userId)
    );
    return {
      success: true,
      user: targetUser,
      notification: existingMsg,
      alreadyHandled: true,
    };
  }

  // Update user status
  targetUser.status = targetStatus;
  targetUser.isApproved = isAccept;

  const now = new Date().toISOString();
  const handlerLabel = adminName || (adminId === 'superadmin-002' ? 'Muhammadjon' : 'Admin');

  let updatedNotif: AppMessage | undefined;

  // Mark all matching registration messages as handled
  state.messages = state.messages.map((m) => {
    const matches =
      (notificationId && m.id === notificationId) ||
      (m.type === 'registration' && m.userId === userId);

    if (matches) {
      const handledMsg: AppMessage = {
        ...m,
        status: 'handled',
        actionTaken: isAccept ? 'accepted' : 'dismissed',
        handledBy: handlerLabel,
        handledAt: now,
        read: true,
      };
      updatedNotif = handledMsg;
      return handledMsg;
    }
    return m;
  });

  saveDbState(state);

  return {
    success: true,
    user: targetUser,
    notification: updatedNotif,
    alreadyHandled: false,
  };
}
