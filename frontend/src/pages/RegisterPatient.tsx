import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { getApiUrl } from '../config/api';
import { PacienteSchema } from '../contracts/paciente';
import { useDoctor } from '../context/DoctorContext';
import { useAuthFetch } from '../hooks/useAuthFetch';

// ...

export default function RegisterPatient() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token } = useDoctor(); // Consuming context (optional if not used elsewhere, but kept minimal change)

    const { register, handleSubmit, setValue, setError, setFocus, clearErrors, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(RegisterFormSchema),
        defaultValues: {
            sexo: "M"
        }
    });

    useEffect(() => {
        const nameQuery = searchParams.get('name');
        if (nameQuery) {
            setValue('fullName', nameQuery);
        }
    }, [searchParams, setValue]);

    const authFetch = useAuthFetch();

    // ... hooks ...

    const onSubmit = async (data: RegisterForm) => {
        setIsSubmitting(true);
        try {
            // Manual name splitting
            const nameParts = data.fullName.trim().split(' ');
            const nombre = nameParts[0] || "SinNombre";
            const apellido_paterno = nameParts.slice(1).join(' ') || "SinApellido";

            const payload = {
                // Mapped Fields
                nombre,
                apellido_paterno,
                apellido_materno: "",
                dni: data.dni,
                fecha_nacimiento: data.fecha_nacimiento,
                sexo: data.sexo,
                telefono: data.telefono || "",
                direccion: "",
                peso: 0,
                talla: 0,
                imc: 0
            };

            const response = await authFetch(getApiUrl('/api/patients'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                toast.success('Paciente registrado correctamente');
                navigate(`/patient/${result.id}`);
            } else {
                if (response.status === 409) {
                    setError('dni', {
                        type: 'manual',
                        message: 'Este DNI ya está registrado en tu lista'
                    });
                    setFocus('dni');
                    // No generic toast for this specific validation error
                } else {
                    console.error("Failed to register");
                    toast.error("Error al registrar: Verifique los datos o intente más tarde");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-6 pt-24">
            <div className="max-w-xl mx-auto">
                <button
                    onClick={() => navigate('/search')}
                    className="flex items-center text-slate-500 hover:text-[#1e3a8a] mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver al buscador
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                    <h1 className="text-2xl font-bold text-[#1e3a8a] mb-6">Nuevo Paciente</h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Nombre Completo</label>
                            <input
                                {...register("fullName")}
                                type="text"
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none transition-all text-slate-800"
                                placeholder="Ej: Juan Pérez"
                            />
                            {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">DNI / Identificación</label>
                            <input
                                {...register("dni", {
                                    onChange: () => {
                                        if (errors.dni?.type === 'manual') {
                                            clearErrors('dni');
                                        }
                                    }
                                })}
                                type="text"
                                className={`w-full px-4 py-3 border rounded-lg outline-none transition-all text-slate-800 ${errors.dni
                                    ? 'border-red-500 focus:ring-2 focus:ring-red-100 focus:border-red-500'
                                    : 'border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a]'
                                    }`}
                                placeholder="Ej: 12345678"
                            />
                            {errors.dni && <p className="text-red-500 text-xs">{errors.dni.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Fecha de Nacimiento</label>
                                <input
                                    {...register("fecha_nacimiento")}
                                    type="date"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none transition-all text-slate-800"
                                />
                                {errors.fecha_nacimiento && <p className="text-red-500 text-xs">{errors.fecha_nacimiento.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Sexo</label>
                                <select
                                    {...register("sexo")}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none transition-all text-slate-800 bg-white"
                                >
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Teléfono</label>
                            <input
                                {...register("telefono")}
                                type="tel"
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none transition-all text-slate-800"
                                placeholder="+54 11 ..."
                            />
                            {errors.telefono && <p className="text-red-500 text-xs">{errors.telefono.message}</p>}
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white font-medium py-3.5 px-6 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                <Save className="h-5 w-5" />
                                {isSubmitting ? 'Guardando...' : 'Guardar y Abrir Ficha'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
