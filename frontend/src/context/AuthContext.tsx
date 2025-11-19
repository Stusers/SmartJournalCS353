import { ClerkProvider, useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useEffect, useState, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'shared';

// Re-export ClerkProvider for use in main.tsx
export { ClerkProvider };

// Custom hook that provides a simplified auth interface compatible with existing code
export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut, getToken } = useClerkAuth();
  const [dbUser, setDbUser] = useState<Omit<User, 'password_hash'> | null>(null);
  const [loading, setLoading] = useState(false);
  const hasFetchedRef = useRef(false);
  const clerkUserIdRef = useRef<string | null>(null);

  // Memoize the Clerk user ID to avoid unnecessary re-renders
  const clerkUserId = useMemo(() => clerkUser?.id || null, [clerkUser?.id]);

  // Fetch database user when Clerk user is available
  useEffect(() => {
    // Only proceed if Clerk is loaded
    if (!isLoaded) {
      return;
    }

    // If no Clerk user ID, clear dbUser and reset
    if (!clerkUserId) {
      if (hasFetchedRef.current) {
        setDbUser(null);
        setLoading(false);
        hasFetchedRef.current = false;
        clerkUserIdRef.current = null;
      }
      return;
    }

    // If we've already fetched for this user, don't fetch again
    if (hasFetchedRef.current && clerkUserIdRef.current === clerkUserId) {
      return;
    }

    // Mark that we're fetching for this user
    hasFetchedRef.current = true;
    clerkUserIdRef.current = clerkUserId;
    setLoading(true);

    let cancelled = false;

    // Fetch the database user
    const fetchDbUser = async () => {
      try {
        // Get token - Clerk's getToken() returns a JWT session token
        const token = await getToken();
        console.log('Token retrieved:', token ? `Token exists (${token.length} chars)` : 'null');
        
        if (!token) {
          console.error('No token available from Clerk');
          throw new Error('No token available');
        }

        if (cancelled) return;

        console.log('Sending request to /api/users/me');
        const response = await fetch('http://localhost:3000/api/users/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
        }

        if (cancelled) return;

        if (response.ok) {
          const user = await response.json();
          setDbUser(user);
        } else {
          throw new Error(`Failed to fetch user: ${response.status}`);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch database user:', error);
          // Reset on error so we can retry
          hasFetchedRef.current = false;
          clerkUserIdRef.current = null;
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDbUser();

    // Cleanup function
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkUserId, isLoaded]); // Only depend on clerkUserId and isLoaded

  const isAuthenticated = useMemo(() => {
    return !!clerkUser && isLoaded && !!dbUser && !loading;
  }, [clerkUser, isLoaded, dbUser, loading]);

  return {
    user: dbUser,
    login: () => {}, // Not needed with Clerk
    logout: () => {
      setDbUser(null);
      hasFetchedRef.current = false;
      clerkUserIdRef.current = null;
      signOut();
    },
    isAuthenticated,
  };
}
