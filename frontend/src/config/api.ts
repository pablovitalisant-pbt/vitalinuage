// Safe-guard para entornos Node/Jest que no soportan sintaxis import.meta
const getBaseUrl = () => {
    try {
        // Usamos globalThis y acceso dinámico para ocultar la sintaxis del parser
        const meta = (globalThis as any).import?.meta || {};
        return meta.env?.VITE_API_URL || 'http://localhost:8000';
    } catch {
        return 'http://localhost:8000';
    }
};

export const API_BASE_URL = getBaseUrl();
export const getApiUrl = (path: string) => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
};

export default {
    apiBaseUrl: API_BASE_URL,
    getApiUrl,
};
