'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BundlesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/combos');
  }, [router]);

  return null;
}
