import { useState, useRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Printer, Upload, Check, FileText } from 'lucide-react';
import { ref, uploadBytes, getBlob } from 'firebase/storage';
import { auth, storage } from '../firebase';
import { useDoctor } from '../context/DoctorContext';

interface PrintSettingsModalProps {
    onClose: () => void;
}

export function PrintSettingsModal({ onClose }: PrintSettingsModalProps) {
    const { preferences, updatePreferences } = useDoctor();
    const [notice, setNotice] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);

    useEffect(() => {
        let isActive = true;
        let objectUrl: string | null = null;

        const loadLogo = async () => {
            if (!preferences.logoPath) {
                setLogoPreviewUrl(null);
                return;
            }

            try {
                const storageRef = ref(storage, preferences.logoPath);
                const blob = await getBlob(storageRef);
                objectUrl = URL.createObjectURL(blob);
                if (isActive) {
                    setLogoPreviewUrl(objectUrl);
                }
            } catch (error) {
                console.warn('Failed to load logo preview', error);
                if (isActive) {
                    setLogoPreviewUrl(null);
                }
            }
        };

        loadLogo();

        return () => {
            isActive = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [preferences.logoPath]);

    const resizeImage = async (file: File, targetWidth: number, targetHeight: number, maxBytes: number) => {
        const image = new Image();
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });

        image.src = dataUrl;
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        const scale = Math.min(targetWidth / image.width, targetHeight / image.height, 1);
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        let quality = 0.9;
        let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        while (blob && blob.size > maxBytes && quality > 0.6) {
            quality -= 0.1;
            blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        }
        if (!blob) throw new Error('No se pudo procesar el logo.');

        return {
            blob,
            previewUrl: canvas.toDataURL('image/jpeg', Math.max(quality, 0.7))
        };
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const uid = auth.currentUser?.uid;
        if (!uid) {
            setNotice('Debes iniciar sesion para subir el logo.');
            return;
        }

        setLogoUploading(true);
        setNotice(null);

        (async () => {
            try {
                const { blob, previewUrl } = await resizeImage(file, 600, 200, 300 * 1024);
                const path = `print-logos/${uid}/logo`;
                const storageRef = ref(storage, path);
                await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
                setLogoPreviewUrl(previewUrl);
                await updatePreferences({ logoPath: path });
                setNotice('Logo guardado correctamente.');
            } catch (error) {
                console.error('Logo upload failed', error);
                setNotice('No se pudo subir el logo.');
            } finally {
                setLogoUploading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        })();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Printer className="h-5 w-5 text-[#1e3a8a]" />
                        <h3 className="text-xl font-bold text-[#1e3a8a]">Preferencias de Impresión</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">

                    {/* Size Selection */}
                    <div>
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Formato de Papel</label>
                        <div className="grid grid-cols-2 gap-4">
                            {(['A4', 'Letter'] as const).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => updatePreferences({ paperSize: size })}
                                    className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 h-24
                                        ${preferences.paperSize === size
                                            ? 'border-[#1e3a8a] bg-blue-50/50 text-[#1e3a8a]'
                                            : 'border-slate-100 hover:border-slate-300 text-slate-600'
                                        }`}
                                >
                                    <FileText className={`h-6 w-6 ${size === 'Letter' ? 'scale-75' : 'scale-100'}`} />
                                    <span className="font-bold">{size}</span>
                                    {preferences.paperSize === size && (
                                        <div className="absolute top-2 right-2 bg-[#1e3a8a] text-white rounded-full p-0.5">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Template Selection */}
                    <div>
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Estilo de Plantilla</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['minimal', 'modern', 'classic'] as const).map((style) => (
                                <button
                                    key={style}
                                    onClick={() => updatePreferences({ templateId: style })}
                                    className={`relative px-3 py-3 rounded-lg border text-sm font-medium transition-all capitalize
                                        ${preferences.templateId === style
                                            ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Logotipo Personalizado</label>
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                {logoPreviewUrl ? (
                                    <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-xs text-slate-400 text-center px-1">Sin Logo</span>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-white text-xs font-medium hover:underline"
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <p className="text-xs text-slate-500 mb-3">Sube tu logo en formato PNG o JPG. Se mostrará en la cabecera de tus recetas.</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={logoUploading}
                                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors disabled:opacity-60"
                                >
                                    <Upload className="h-4 w-4" />
                                    {logoUploading ? 'Subiendo...' : 'Subir Imagen'}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Color Customization */}
                    <div>
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Colores Institucionales</label>
                        <div className="flex gap-6">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 mb-1 block">Color Primario (Encabezados/Bordes)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={preferences.primaryColor || "#1e3a8a"}
                                        onChange={(e) => updatePreferences({ primaryColor: e.target.value })}
                                        className="h-10 w-16 p-0 border-0 rounded overflow-hidden cursor-pointer shadow-sm"
                                    />
                                    <span className="text-sm font-mono text-slate-600 uppercase">{preferences.primaryColor || "#1e3a8a"}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 mb-1 block">Color Secundario (Detalles)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={preferences.secondaryColor || "#64748b"}
                                        onChange={(e) => updatePreferences({ secondaryColor: e.target.value })}
                                        className="h-10 w-16 p-0 border-0 rounded overflow-hidden cursor-pointer shadow-sm"
                                    />
                                    <span className="text-sm font-mono text-slate-600 uppercase">{preferences.secondaryColor || "#64748b"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                    <span className={`text-xs ${notice ? 'text-amber-600' : 'text-slate-400'}`}>
                        {notice || 'Cambios guardados automaticamente'}
                    </span>
                    <button
                        onClick={() => {
                            const consultationId = prompt('Ingresa un ID de consulta para previsualizar el PDF:', '1');
                            if (consultationId) {
                                window.open(`/api/consultas/${consultationId}/pdf`, '_blank');
                            }
                        }}
                        className="px-6 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium text-sm shadow-sm transition-colors"
                    >
                        👁️ Ver Vista Previa
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-900 font-medium text-sm shadow-sm transition-colors"
                    >
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
}

