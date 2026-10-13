import { db, users, matchmakers } from '@/db';
import { eq } from 'drizzle-orm';
import { store } from '@/lib/db/store';

export interface AuthUserData {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt?: Date | string;
}

export async function findUserByEmail(email: string): Promise<AuthUserData | null> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Try Neon DB users table
    const [neonUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (neonUser) {
      return {
        id: neonUser.id,
        name: neonUser.name,
        email: neonUser.email,
        passwordHash: neonUser.passwordHash,
        role: neonUser.role,
        createdAt: neonUser.createdAt,
      };
    }
  } catch (err) {
    console.warn(
      '[AuthDB] Neon DB query failed, using in-memory store:',
      err instanceof Error ? err.message : String(err)
    );
  }

  // 2. Fallback to in-memory store
  const storeUser = store.getMatchmakerByEmail(cleanEmail);
  if (storeUser) {
    return {
      id: storeUser.id,
      name: storeUser.name,
      email: storeUser.email,
      passwordHash: storeUser.passwordHash,
      role: storeUser.role,
      createdAt: storeUser.createdAt,
    };
  }

  return null;
}

export async function findUserById(id: string): Promise<AuthUserData | null> {
  try {
    const [neonUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (neonUser) {
      return {
        id: neonUser.id,
        name: neonUser.name,
        email: neonUser.email,
        passwordHash: neonUser.passwordHash,
        role: neonUser.role,
        createdAt: neonUser.createdAt,
      };
    }
  } catch {
    // Fall back to store
  }

  const storeUser = store.getMatchmakerById(id);
  if (storeUser) {
    return {
      id: storeUser.id,
      name: storeUser.name,
      email: storeUser.email,
      passwordHash: storeUser.passwordHash,
      role: storeUser.role,
      createdAt: storeUser.createdAt,
    };
  }

  return null;
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
}): Promise<AuthUserData> {
  const cleanEmail = data.email.trim().toLowerCase();
  const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const role = data.role || 'Senior Matchmaker';

  // 1. Save to in-memory store for instant sync
  const storeUser = store.addMatchmaker({
    id,
    name: data.name,
    email: cleanEmail,
    passwordHash: data.passwordHash,
    role,
  });

  // 2. Persist to Neon DB
  try {
    await db.insert(users).values({
      id,
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash: data.passwordHash,
      role,
    });

    // Also sync to matchmakers table
    await db.insert(matchmakers).values({
      id,
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash: data.passwordHash,
      role,
    });
  } catch (err) {
    console.warn(
      '[AuthDB] Could not write to Neon DB:',
      err instanceof Error ? err.message : String(err)
    );
  }

  return {
    id,
    name: storeUser.name,
    email: storeUser.email,
    passwordHash: storeUser.passwordHash,
    role: storeUser.role,
    createdAt: storeUser.createdAt,
  };
}
