export const patientService = {
    getAll: async (fetcher: (url: string, options?: RequestInit) => Promise<Response>) => {
        const res = await fetcher('/api/patients');
        if (!res.ok) throw new Error('Error fetching patients');
        return res.json();
    },
    search: async (fetcher: (url: string, options?: RequestInit) => Promise<Response>, query: string) => {
        // Here we assume fetcher handles the base auth, but we need to ensure the caller passes the right fetcher (authFetch)
        const res = await fetcher(`/api/patients/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Error searching patients');
        return res.json();
    }
};
