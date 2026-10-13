import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserByEmail, createUser } from '@/lib/db/auth-db';
import { hashPassword, createSession } from '@/lib/auth/session';

const SignUpSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.string().optional().default('Senior Matchmaker'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SignUpSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid input data.';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, email, password, role } = parsed.data;

    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // Hash password securely with scrypt + salt
    const passwordHash = hashPassword(password);

    // Save user in Neon DB & memory store
    const user = await createUser({
      name,
      email,
      passwordHash,
      role: role || 'Senior Matchmaker',
    });

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Auto sign-in by setting httpOnly cookie session
    await createSession(sessionUser);

    return NextResponse.json(
      {
        success: true,
        user: sessionUser,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
