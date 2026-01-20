import { useState, useEffect } from 'react';
import { DashboardStats, DashboardStatsSchema } from '../contracts/dashboard';
import { useAuthFetch } from './useAuthFetch';
import { getApiUrl } from '../config/api';

export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const authFetch = useAuthFetch();

    const refresh = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authFetch(getApiUrl('/api/doctors/dashboard/stats'));

            if (!response.ok) {
                throw new Error(`Error ${response.status}: Failed to fetch stats`);
            }

            const rawData = await response.json();

            // Validate Contract
            const parsedData = DashboardStatsSchema.parse(rawData);
            setStats(parsedData);

        } catch (err: any) {
            if (err.message !== 'AUTH_TOKEN_MISSING' && err.message !== 'AUTH_401') {
                console.error("Dashboard Stats Error:", err);
                setError("Error loading stats");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { stats, isLoading, error, refresh };
}
