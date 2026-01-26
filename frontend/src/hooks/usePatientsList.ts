import { useState, useEffect, useCallback, useMemo } from 'react';
import { PatientListResponse, PatientListResponseSchema } from '../contracts/patient';
import { useAuthFetch } from './useAuthFetch';
import { getApiUrl } from '../config/api';

export function usePatientsList(initialPage = 1, size = 10) {
    const [data, setData] = useState<PatientListResponse | null>(null);
    const [page, setPage] = useState(initialPage);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const authFetch = useAuthFetch();

    const fetchPatients = useCallback(async (p: number, s: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const url = new URL(getApiUrl('/api/patients'));
            url.searchParams.append('page', p.toString());
            url.searchParams.append('size', size.toString());
            if (s) {
                url.searchParams.append('search', s);
            }

            const res = await authFetch(url.toString());

            if (!res.ok) throw new Error('Failed to fetch patients');

            const raw = await res.json();
            const parsed = PatientListResponseSchema.parse(raw);
            setData(parsed);

            // Important: only update page from server if it's different to avoid loops
            // if we are changing page manually, we want to stay on that page.
            // But if the server says we are on page X, we should reflect it.
            if (parsed.page !== p) {
                setPage(parsed.page);
            }
        } catch (err: any) {
            if (err.message !== 'AUTH_TOKEN_MISSING' && err.message !== 'AUTH_401') {
                console.error(err);
                setError("Error cargando pacientes.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [authFetch, size]);

    useEffect(() => {
        fetchPatients(page, search);
    }, [page, search, fetchPatients]);

    // When search changes, reset page to 1
    const handleSetSearch = useCallback((s: string) => {
        // Only reset if search actually changed
        setSearch(prev => {
            if (prev !== s) {
                setPage(1);
                return s;
            }
            return prev;
        });
    }, []);

    const result = useMemo(() => ({
        data,
        page,
        setPage,
        search,
        setSearch: handleSetSearch,
        isLoading,
        error,
        refresh: () => fetchPatients(page, search)
    }), [data, page, search, handleSetSearch, isLoading, error, fetchPatients]);

    return result;
}
