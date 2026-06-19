import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';

import {
  createUser,
  getOrCreateOAuthUser,
  getUser,
  migrateChatsToUser,
} from '@/lib/db/queries';
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

const githubProvider =
  process.env.GITHUB_ID && process.env.GITHUB_SECRET
    ? GitHub({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      })
    : null;

export const githubAuthEnabled = Boolean(githubProvider);

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: 'credentials',
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
    ...(githubProvider ? [githubProvider] : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'github' && user.email) {
        const oauthUser = await getOrCreateOAuthUser(user.email);
        user.id = oauthUser.id;

        const cookieStore = await cookies();
        const migrateFrom = cookieStore.get('migrate_from_user_id')?.value;
        if (migrateFrom && migrateFrom !== oauthUser.id) {
          await migrateChatsToUser({
            fromUserId: migrateFrom,
            toUserId: oauthUser.id,
          });
        }
        cookieStore.delete('migrate_from_user_id');
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.id = user.id;
      } else if (account?.provider === 'github' && token.email) {
        const oauthUser = await getOrCreateOAuthUser(token.email as string);
        token.id = oauthUser.id;
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
