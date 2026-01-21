
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getApiUrl = (path: string) => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
};

export const api = {
    exportData: async (fetcher: (url: string, options?: RequestInit) => Promise<Response>) => {
        const response = await fetcher(getApiUrl('/api/data/export'));
        if (!response.ok) throw new Error('Error downloading data');
        return response.blob();
    },

    importData: async (fetcher: (url: string, options?: RequestInit) => Promise<Response>, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetcher(getApiUrl('/api/data/import'), {
            method: 'POST',
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
