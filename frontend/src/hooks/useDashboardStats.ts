
import { useState, useEffect } from 'react';
import { DashboardStats, DashboardStatsSchema } from '../contracts/dashboard';
import { useDoctor } from '../context/DoctorContext';
import { getApiUrl } from '../config/api';

export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useDoctor();

    const refresh = async () => {
        if (!token) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(getApiUrl('/api/doctors/dashboard/stats'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: Failed to fetch stats`);
            }

            const rawData = await response.json();

            // Validate Contract
            const parsedData = DashboardStatsSchema.parse(rawData);
            setStats(parsedData);

        } catch (err) {
            console.error("Dashboard Stats Error:", err);
            setError("Error loading stats");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            refresh();
        }
    }, [token]);

    return { stats, isLoading, error, refresh };
}
