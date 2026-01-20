import { useState, useEffect } from 'react';
import { patientService } from '../services/patientService';
import { useDoctor } from '../context/DoctorContext';
import { useAuthFetch } from './useAuthFetch';

export function usePatients() {
    const { token } = useDoctor();
    const authFetch = useAuthFetch();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const loadPatients = async () => {
            try {
                setLoading(true);
                const data = await patientService.getAll(authFetch);
                setPatients(data || []);
            } catch (err: any) {
                setError(err.message || 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        loadPatients();
    }, [token, authFetch]);

    return {
        patients,
        loading,
        error,
        isEmpty: !loading && patients.length === 0
    };
}
