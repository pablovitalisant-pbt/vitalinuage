
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getApiUrl = (path: string) => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
};

export const api = {
    exportData: async (token: string) => {
        const response = await fetch(getApiUrl('/api/data/export'), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Error downloading data');
        return response.blob();
    },

    importData: async (token: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(getApiUrl('/api/data/import'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Content-Type is auto-set by browser with boundary for FormData
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Import failed');
        }
        return response.json();
    }
};

export default {
    apiBaseUrl: API_BASE_URL,
    getApiUrl,
    ...api
};
