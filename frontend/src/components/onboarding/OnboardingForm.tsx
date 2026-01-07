
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileUpdateSchema, ProfileUpdate } from '../../contracts/user';

import { useDoctor, DoctorProfile } from '../../context/DoctorContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function OnboardingForm() {
    const { completeOnboarding, refreshProfile } = useDoctor();
    const navigate = useNavigate();
    const [apiError, setApiError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isValid }
    } = useForm<ProfileUpdate>({
        resolver: zodResolver(ProfileUpdateSchema),
        mode: "onChange"
    });

    const onSubmit = async (data: ProfileUpdate) => {
        setApiError(null);
        try {
            // Map form data to internal DoctorProfile structure if needed, or pass DTO
            const profileData: DoctorProfile = {
                professionalName: data.professional_name,
                specialty: data.specialty,
                registrationNumber: data.registration_number, // Using registration_number as primary ID
                phone: "", // Not in form yet
                address: "",
                isOnboarded: false, // Will be set to true by API
                email: "" // Context handles this
            };

            await completeOnboarding(profileData);
            await refreshProfile();
            navigate('/dashboard'); // Automatic redirection
        } catch (err) {
            console.error(err);
            setApiError("Error al completar el onboarding. Por favor intente nuevamente.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
            {apiError && (
                <div style={{ padding: '0.5rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
                    {apiError}
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="professional_name">Nombre Profesional</label>
                <input
                    id="professional_name"
                    {...register("professional_name")}
                    placeholder="Dr. Nombre Apellido"
                    style={{ padding: '0.5rem' }}
                />
                {errors.professional_name && <span style={{ color: 'red' }}>{errors.professional_name.message}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="specialty">Especialidad</label>
                <input
                    id="specialty"
                    {...register("specialty")}
                    placeholder="Ej. Cardiología"
                    style={{ padding: '0.5rem' }}
                />
                {errors.specialty && <span style={{ color: 'red' }}>{errors.specialty.message}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="medical_license">Matrícula</label>
                <input
                    id="medical_license"
                    {...register("medical_license")}
                    placeholder="Ej. MP-12345"
                    style={{ padding: '0.5rem' }}
                />
                {errors.medical_license && <span style={{ color: 'red' }}>{errors.medical_license.message}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="registration_number">Número de Registro</label>
                <input
                    id="registration_number"
                    {...register("registration_number")}
                    placeholder="Ej. REG-999"
                    style={{ padding: '0.5rem' }}
                />
                {errors.registration_number && <span style={{ color: 'red' }}>{errors.registration_number.message}</span>}
            </div>

            <button
                type="submit"
                disabled={!isValid || isSubmitting}
                style={{
                    padding: '0.75rem',
                    marginTop: '1rem',
                    backgroundColor: (!isValid || isSubmitting) ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    cursor: (!isValid || isSubmitting) ? 'not-allowed' : 'pointer'
                }}
            >
                {isSubmitting ? 'Procesando...' : 'Completar Perfil'}
            </button>
        </form>
    );
}
