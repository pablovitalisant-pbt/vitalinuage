export const patientService = {
    getAll: async (token: string) => {
        const res = await fetch('/api/pacientes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error fetching patients');
        return res.json();
    },
    search: async (token: string, query: string) => {
        const res = await fetch(`/api/pacientes/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error searching patients');
        return res.json();
    }
};
