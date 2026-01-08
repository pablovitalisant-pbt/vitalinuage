
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OnboardingSchema, OnboardingData } from '../contracts/user';
import { useDoctor } from '../context/DoctorContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function OnboardingView() {
    const { completeOnboarding, profile } = useDoctor(); // profile for initial values if we had them
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Defensive Check: Redirect if already onboarded

    React.useEffect(() => {
        if (profile.isOnboarded) {
            navigate('/dashboard', { replace: true });
        }
    }, [profile.isOnboarded, navigate]);


    const { register, handleSubmit, formState: { errors } } = useForm<OnboardingData>({
        resolver: zodResolver(OnboardingSchema),
        defaultValues: {
            professional_name: profile.professionalName !== "Dr. Vitali" ? profile.professionalName : "",
            specialty: profile.specialty || "",
            medical_license: profile.registrationNumber || "",
            onboarding_completed: true
        }
    });

    const onSubmit = async (data: OnboardingData) => {
        setIsSubmitting(true);
        try {
            await completeOnboarding({
                professionalName: data.professional_name,
                specialty: data.specialty,
                address: "", // Ignore in onboarding
                phone: "",   // Ignore in onboarding
                registrationNumber: data.medical_license,
                isOnboarded: true, email: "doctor@vitalinuage.com"
            });
            toast.success("Perfil configurado con éxito");
            navigate('/dashboard');
        } catch (error) {
            toast.error("Error al guardar el perfil");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Bienvenido a Vitalinuage
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Configuremos tu perfil profesional para comenzar.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label htmlFor="professional_name" className="block text-sm font-medium text-slate-700">
                                Nombre Profesional
                            </label>
                            <div className="mt-1">
                                <input
                                    id="professional_name"
                                    type="text"
                                    {...register("professional_name")}
                                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Ej. Dr. Juan Pérez"
                                />
                                {errors.professional_name && <p className="mt-1 text-sm text-red-600">{errors.professional_name.message}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="specialty" className="block text-sm font-medium text-slate-700">
                                Especialidad
                            </label>
                            <div className="mt-1">
                                <input
                                    id="specialty"
                                    type="text"
                                    {...register("specialty")}
                                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Ej. Cardiología"
                                />
                                {errors.specialty && <p className="mt-1 text-sm text-red-600">{errors.specialty.message}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="medical_license" className="block text-sm font-medium text-slate-700">
                                Matrícula / Licencia
                            </label>
                            <div className="mt-1">
                                <input
                                    id="medical_license"
                                    type="text"
                                    {...register("medical_license")}
                                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                {errors.medical_license && <p className="mt-1 text-sm text-red-600">{errors.medical_license.message}</p>}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Guardando...' : 'Finalizar Configuración'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}



