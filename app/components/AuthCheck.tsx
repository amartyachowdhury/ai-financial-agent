'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

import { ensureSession } from '@/app/(auth)/actions';

export function AuthCheck() {
  const { status } = useSession();
  const router = useRouter();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (status !== 'unauthenticated' || attemptedRef.current) {
      return;
    }

    attemptedRef.current = true;

    void ensureSession({ status: 'idle' }).then((result) => {
      if (result.status === 'success') {
        router.refresh();
      }
    });
  }, [status, router]);

  return null;
}
