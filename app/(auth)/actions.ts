'use server';

import { signIn } from './auth';

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
