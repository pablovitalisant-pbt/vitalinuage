export interface DoctorProfile {
    professional_name: string;
    specialty: string;
    registration_number: string;
}

export interface PatientSearchResult {
    id: number;
    nombre_completo: string;
    dni: string;
    imc: number;
}

export interface PatientSearchResponse {
    results: PatientSearchResult[];
}
