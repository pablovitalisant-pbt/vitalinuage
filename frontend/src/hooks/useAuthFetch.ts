/**
 * useAuthFetch Hook
 * 
 * React hook that provides a pre-configured authFetch function
 * integrated with DoctorContext for automatic token management.
 * 
 * Usage:
 *   const authFetch = useAuthFetch();
 *   const response = await authFetch(getApiUrl('/api/patients'));
 * 
 * Features:
 * - Automatically retrieves fresh token from Firebase
 * - Handles 401 by triggering logout
 * - No manual token management needed
 */

import { useCallback } from 'react';
import { useDoctor } from '../context/DoctorContext';
import { createAuthFetch } from '../lib/authFetch';

export function useAuthFetch() {
    const { user, logout } = useDoctor();

    // Token retrieval function
    const getToken = useCallback(async (): Promise<string | null> => {
        if (!user) {
            console.warn('[AUTH AUDIT] useAuthFetch: No user available');
            return null;
        }

        try {
            // Get fresh token from Firebase
            const token = await user.getIdToken();
            return token;
        } catch (error) {
            console.error('[AUTH AUDIT] useAuthFetch: Failed to get token', error);
            return null;
        }
    }, [user]);

    // Unauthorized handler
    const onUnauthorized = useCallback(async () => {
        console.log('[AUTH AUDIT] Unauthorized -> logout');
        await logout();
    }, [logout]);

    // Create and return configured authFetch
    const authFetch = useCallback(
        (url: string, init?: RequestInit, options?: { requireAuth?: boolean }) => {
            return createAuthFetch(getToken, onUnauthorized)(url, init, options);
        },
        [getToken, onUnauthorized]
    );

    return authFetch;
}
