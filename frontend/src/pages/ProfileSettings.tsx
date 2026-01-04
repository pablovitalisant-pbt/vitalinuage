import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Upload, User, Image as ImageIcon, Printer } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

import { useDoctor } from '../context/DoctorContext';
import { PrintSettingsModal } from '../components/PrintSettingsModal';

interface ProfileForm {
    professionalName: string;
    specialty: string;
    address: string;
    phone: string;
}

export default function ProfileSettings() {
    const { refreshProfile } = useDoctor();
    const [isSaved, setIsSaved] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [showPrintSettings, setShowPrintSettings] = useState(false);

    const { register, handleSubmit, setValue } = useForm<ProfileForm>();

    // Load initial data
    useEffect(() => {
        fetch('/api/doctor/profile')
            .then(res => res.json())
            .then(data => {
                setValue('professionalName', data.professional_name);
                setValue('specialty', data.specialty);
                setValue('address', data.address);
                setValue('phone', data.phone);
            })
            .catch(err => console.error("Error loading profile", err));

        // Fetch Preferences for Signature
        fetch('/api/print/preferences')
            .then(res => res.json())
            .then(data => {
                if (data.signature_url) {
                    setSignatureUrl(data.signature_url);
                }
            })
            .catch(err => console.error("Error loading signature", err));
    }, [setValue]);

    const onSubmit = async (data: ProfileForm) => {
        try {
            const payload = {
                professional_name: data.professionalName,
                specialty: data.specialty,
                address: data.address,
                phone: data.phone
            };

            const response = await fetch('/api/doctor/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await refreshProfile(); // Sync global context
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 3000);
            }
        } catch (error) {
            console.error("Error saving profile", error);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    }, []);

    const handleSignatureSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Preview
            const url = URL.createObjectURL(file);
            setSignatureUrl(url);

            // Upload immediately
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('/api/doctor/signature', {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) {
                    setIsSaved(true);
                    setTimeout(() => setIsSaved(false), 3000);
                }
            } catch (err) {
                console.error("Error uploading signature", err);
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-6 pt-24">
            <div className="max-w-3xl mx-auto">

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[#1e3a8a]">Configuración de Perfil</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Personaliza tu información y apariencia. Estos datos son visibles en tus recetas.
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                        {/* Photo Upload Section */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Foto de Perfil</label>
                            <div className="flex gap-6 items-start">
                                {/* Preview Circle */}
                                <div className="flex-shrink-0">
                                    <div className="h-24 w-24 rounded-full border-2 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-10 w-10 text-slate-300" />
                                        )}
                                    </div>
                                </div>

                                {/* Drag Zone */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={twMerge(
                                        "flex-1 border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer group relative",
                                        isDragging
                                            ? "border-[#1e3a8a] bg-blue-50/50"
                                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className={twMerge(
                                            "p-3 rounded-full mb-3 transition-colors",
                                            isDragging ? "bg-blue-100 text-[#1e3a8a]" : "bg-slate-100 text-slate-400 group-hover:text-slate-500"
                                        )}>
                                            <ImageIcon className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 mb-1">
                                            {isDragging ? "¡Suelta la imagen aquí!" : "Arrastra tu foto aquí"}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            O haz clic para seleccionar (JPG, PNG)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Signature Upload Section */}
                        <div className="mt-8">
                            <label className="block text-sm font-medium text-slate-700 mb-3">Firma y Sello (Opcional)</label>
                            <p className="text-xs text-slate-500 mb-2">Sube una imagen (PNG con fondo transparente recomendado) de tu firma y sello.</p>

                            <div className="flex gap-6 items-start">
                                {/* Preview Box (Rectangular for signature) */}
                                <div className="flex-shrink-0">
                                    <div className="h-24 w-40 rounded-lg border-2 border-slate-100 overflow-hidden bg-white flex items-center justify-center">
                                        {signatureUrl ? (
                                            <img src={signatureUrl} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                                        ) : (
                                            <span className="text-xs text-slate-400">Sin firma</span>
                                        )}
                                    </div>
                                </div>

                                {/* Drag Zone for Signature */}
                                <div className="flex-1 border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl p-6 relative flex flex-col items-center justify-center text-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSignatureSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <ImageIcon className="h-6 w-6 text-slate-400 mb-2" />
                                    <p className="text-sm font-medium text-slate-700">Arrastra o selecciona tu firma</p>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Nombre Profesional</label>
                                <input
                                    {...register("professionalName")}
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none transition-all text-slate-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Especialidad</label>
                                <input
                                    {...register("specialty")}
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none transition-all text-slate-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Dirección del Consultorio</label>
                                <input
                                    {...register("address")}
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none transition-all text-slate-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Teléfono de Contacto</label>
                                <input
                                    {...register("phone")}
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none transition-all text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            <div>
                                {isSaved && (
                                    <span className="text-sm text-green-600 font-medium animate-in fade-in">
                                        ✓ Cambios guardados correctamente
                                    </span>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white font-medium py-2.5 px-6 rounded-lg transition-all shadow-sm active:scale-95"
                            >
                                <Save className="h-4 w-4" />
                                Guardar Cambios
                            </button>
                        </div>

                    </form>
                </div>

                {/* Print Settings Section */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                                <Printer className="h-5 w-5" />
                                Preferencias de Impresión
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">
                                Configura el diseño, papel y colores de tus recetas PDF.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowPrintSettings(true)}
                            className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white font-medium py-2.5 px-6 rounded-lg transition-all shadow-sm active:scale-95"
                        >
                            <Printer className="h-4 w-4" />
                            Configurar Impresión
                        </button>
                    </div>
                </div>

                {/* Talonario Map Section (Slice 15.3) */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                                <Printer className="h-5 w-5" />
                                Mapeo de Talonario A5
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">
                                Calibra la posición del texto para imprimir sobre tus recetarios físicos pre-impresos.
                            </p>
                        </div>

                        <a
                            href="/settings/talonario"
                            className="flex items-center gap-2 bg-white border border-[#1e3a8a] text-[#1e3a8a] hover:bg-blue-50 font-medium py-2.5 px-6 rounded-lg transition-all shadow-sm active:scale-95"
                        >
                            Calibrar Talonario
                        </a>
                    </div>
                </div>

            </div >

            {showPrintSettings && (
                <PrintSettingsModal onClose={() => setShowPrintSettings(false)} />
            )
            }
        </div >
    );
}
