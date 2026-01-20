import { getApiUrl } from '../config/api';

export interface DoctorProfile {
    isOnboarded: boolean;
    isVerified: boolean;
    email: string;
    professionalName?: string;
    specialty?: string;
    registrationNumber?: string;
    // legacy/snake_case support if needed, though interface handles camelCase
    professional_name?: string;
    registration_number?: string;
    is_onboarded?: boolean;
}

/**
 * Fetches the doctor's profile using the provided authenticated fetcher.
 * 
 * @param authFetch - The secure fetch function (created via createAuthFetch)
 * @returns The doctor's profile or throws error
 */
export async function fetchDoctorProfile(authFetch: (url: string, init?: RequestInit) => Promise<Response>): Promise<DoctorProfile> {
    const response = await authFetch(getApiUrl('/api/doctors/profile'));

    if (!response.ok) {
        throw new Error(`Profile fetch failed with status: ${response.status}`);
    }

    return response.json();
}
