'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signIn, signOut, fetchAuthSession, confirmSignIn } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

// Configure Amplify BEFORE any hooks use it
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_4qSZVI2WH',
      userPoolClientId: '223nnbea9edf3tach13ilck1mq',
    },
  },
});

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requiresNewPassword: boolean }>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    console.log('AuthContext - checkUser() called');
    try {
      const currentUser = await getCurrentUser();
      console.log('AuthContext - getCurrentUser() returned:', currentUser);
      setUser(currentUser);
    } catch (error) {
      console.log('AuthContext - getCurrentUser() error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const result = await signIn({ username: email, password });
    
    if (result.isSignedIn) {
      await checkUser();
      return { requiresNewPassword: false };
    } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      return { requiresNewPassword: true };
    }
    
    return { requiresNewPassword: false };
  }

  async function completeNewPassword(newPassword: string) {
    const result = await confirmSignIn({ challengeResponse: newPassword });
    
    if (result.isSignedIn) {
      await checkUser();
    }
  }

  async function logout() {
    await signOut();
    setUser(null);
  }

  async function getAccessToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() || null;
    } catch (error) {
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, completeNewPassword, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}