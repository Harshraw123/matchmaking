import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserByEmail } from '@/lib/db/auth-db';
import { verifyPassword, createSession } from '@/lib/auth/session';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please provide a valid email and password.' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const matchmaker = await findUserByEmail(email);

    if (!matchmaker) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your email and password.' },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, matchmaker.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify your email and password.' },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: matchmaker.id,
      name: matchmaker.name,
      email: matchmaker.email,
      role: matchmaker.role,
    };

    await createSession(sessionUser);

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
