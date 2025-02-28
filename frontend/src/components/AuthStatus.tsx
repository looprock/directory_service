'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export default function AuthStatus() {
  const { data: session } = useSession()
  
  if (!session) {
    return (
      <button
        onClick={() => signIn('google', { 
          prompt: 'select_account',
          callbackUrl: '/'
        })}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Sign in
      </button>
    )
  }

  const handleSignOut = async () => {
    // Clear any local storage or cookies
    localStorage.clear()
    sessionStorage.clear()
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Sign out with NextAuth
    await signOut({ 
      callbackUrl: '/',
      redirect: false
    })

    // Force a full page reload to clear all state
    window.location.replace('/')
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-500">
        Signed in as {session.user?.email}
      </span>
      <button
        onClick={handleSignOut}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Sign out
      </button>
    </div>
  )
} 