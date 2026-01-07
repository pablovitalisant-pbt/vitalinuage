export interface DoctorProfile {
    id: number;
    email: string;
    fullName: string;
    // Optional fields to prevent UI crashes if data is incomplete
    medicalLicense?: string;
    specialty?: string;
    phone?: string;
    address?: string;
    bio?: string;
    profileImage?: string;
    // System fields
    role?: string;
    isVerified?: boolean;
    createdAt?: string;

    // Legacy/Migration mapping
    nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
}
