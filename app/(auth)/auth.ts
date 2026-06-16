import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { createUser, getUser } from '@/lib/db/queries';
import type { User } from '@/lib/db/schema';
import { authConfig } from './auth.config';

function createFingerprint(): string {
  return crypto.randomBytes(16).toString('hex');
}

interface FingerprintResult {
  fingerprint: string;
  autoEmail: string;
}

/**
 * Reads the fingerprint cookie when present, otherwise creates one.
 * Each fingerprint maps to a stable anonymous user for this demo.
 */
export async function getOrSetFingerprint(): Promise<FingerprintResult> {
  const cookieStore = await cookies();
  const storedFingerprint = cookieStore.get('fingerprint');

  let fingerprint: string;

  if (storedFingerprint) {
    fingerprint = storedFingerprint.value;
  } else {
    fingerprint = createFingerprint();

    cookieStore.set('fingerprint', fingerprint, {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      path: '/',
      sameSite: 'lax',
    });
  }

  const autoEmail = `user-${fingerprint.slice(0, 12)}@auto.generated`;

  return {
    fingerprint,
    autoEmail,
  };
}

function toAuthUser(dbUser: User) {
  return {
    id: dbUser.id,
    email: dbUser.email,
  };
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize() {
        const { autoEmail } = await getOrSetFingerprint();
        const users = await getUser(autoEmail);

        if (users.length > 0) {
          return toAuthUser(users[0]);
        }

        const randomPassword = crypto.randomBytes(16).toString('hex');
        await createUser(autoEmail, randomPassword);

        const [newUser] = await getUser(autoEmail);
        if (!newUser) {
          return null;
        }

        return toAuthUser(newUser);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
});
