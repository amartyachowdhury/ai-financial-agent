import type { NextAuthConfig } from 'next-auth';

/**
 * Demo auth uses a browser fingerprint cookie, not email/password.
 * AuthCheck calls ensureSession() on load to create or restore the session.
 */
export const authConfig = {
  providers: [],
  callbacks: {
    authorized() {
      return true;
    },
  },
} satisfies NextAuthConfig;
