import { useState, useEffect } from 'react';
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

    const fetchPatients = async (p: number, s: string) => {
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

            // Should valid page returned from server be used? Yes.
            // But if we search, server might return page 1.
            setPage(parsed.page);
        } catch (err: any) {
            if (err.message !== 'AUTH_TOKEN_MISSING' && err.message !== 'AUTH_401') {
                console.error(err);
                setError("Error cargando pacientes.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients(page, search);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search]);

    // When search changes, reset page to 1 (optional optimization, but good UX)
    // We can wrap setSearch to do this.
    const handleSetSearch = (s: string) => {
        setSearch(s);
        setPage(1);
    };

    return {
        data,
        page,
        setPage,
        search,
        setSearch: handleSetSearch,
        isLoading,
        error,
        refresh: () => fetchPatients(page, search)
    };
}
