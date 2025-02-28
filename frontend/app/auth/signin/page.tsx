'use client';

import { signIn } from 'next-auth/react';
import { useEffect } from 'react';

export default function SignIn() {
  useEffect(() => {
    signIn('google', { callbackUrl: '/' });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to Google sign-in...</p>
    </div>
  );
} 