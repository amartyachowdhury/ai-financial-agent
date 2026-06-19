'use server';

import { cookies } from 'next/headers';

import { auth, signIn } from './auth';

export interface EnsureSessionState {
  status: 'idle' | 'success' | 'failed';
}

/**
 * Creates or restores an anonymous demo session tied to the browser fingerprint cookie.
 */
export async function ensureSession(
  _: EnsureSessionState,
): Promise<EnsureSessionState> {
  try {
    await signIn('credentials', {
      redirect: false,
    });

    return { status: 'success' };
  } catch {
    return { status: 'failed' };
  }
}

/**
 * Signs in with GitHub and migrates anonymous chat history to the OAuth account.
 */
export async function signInWithGitHub() {
  const session = await auth();
  const cookieStore = await cookies();

  if (session?.user?.id) {
    cookieStore.set('migrate_from_user_id', session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    });
  }

  await signIn('github', { redirectTo: '/' });
}
