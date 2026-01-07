
import { useState, useEffect } from 'react';
import { PatientListResponse, PatientListResponseSchema } from '../contracts/patient';
import { useDoctor } from '../context/DoctorContext';
import { getApiUrl } from '../config/api';

export function usePatientsList(initialPage = 1, size = 10) {
    const [data, setData] = useState<PatientListResponse | null>(null);
    const [page, setPage] = useState(initialPage);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useDoctor();

    const fetchPatients = async (p: number, s: string) => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            const url = new URL(getApiUrl('/api/patients'));
            url.searchParams.append('page', p.toString());
            url.searchParams.append('size', size.toString());
            if (s) {
                url.searchParams.append('search', s);
            }

            const res = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to fetch patients');

            const raw = await res.json();
            const parsed = PatientListResponseSchema.parse(raw);
            setData(parsed);

            // Should valid page returned from server be used? Yes.
            // But if we search, server might return page 1.
            setPage(parsed.page);
        } catch (err) {
            console.error(err);
            setError("Error cargando pacientes.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            // If search changes, we probably want to reset page to 1, but this effect handles "page" or "token" change.
            // If search changes, we need to trigger logic. 
            // Better to have: dependency on [page, search, token].
            fetchPatients(page, search);
        }
    }, [page, search, token]);

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
