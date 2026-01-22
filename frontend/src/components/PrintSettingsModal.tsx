import { useState, useRef } from 'react';
import { useDoctor } from '../context/DoctorContext';
import { Printer, Upload, Check, FileText } from 'lucide-react';

interface PrintSettingsModalProps {
    onClose: () => void;
}

export function PrintSettingsModal({ onClose }: PrintSettingsModalProps) {
    const { preferences, updatePreferences } = useDoctor();
    const [notice, setNotice] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setNotice('La carga de logo esta en revision.');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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
                                {preferences.logoUrl ? (
                                    <img src={preferences.logoUrl} alt="Logo" className="w-full h-full object-contain" />
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
                                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                                >
                                    <Upload className="h-4 w-4" />
                                    Subir Imagen
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
                    {notice ? (
                        <span className="text-xs text-amber-600">{notice}</span>
                    ) : (
                        <span className="text-xs text-slate-400">Funciones en revision</span>
                    )}
                    <button
                        onClick={() => setNotice('La vista previa esta en revision.')}
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

