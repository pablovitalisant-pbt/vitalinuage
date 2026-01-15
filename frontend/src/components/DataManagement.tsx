
import React, { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, FileUp, Loader2 } from 'lucide-react';
import { api } from '../config/api';
import { useDoctor } from '../context/DoctorContext';
import toast from 'react-hot-toast';

interface ImportStats {
    patients_processed: number;
    patients_inserted: number;
    consultations_inserted: number;
    errors: string[];
}

export default function DataManagement() {
    const { token } = useDoctor();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importStats, setImportStats] = useState<ImportStats | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        if (!token) return;
        try {
            setIsExporting(true);
            const blob = await api.exportData(token);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vitalinuage_backup_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Respaldo descargado correctamente');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Error al descargar el respaldo');
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        if (!file.name.endsWith('.zip')) {
            toast.error('Solo se permiten archivos .zip');
            return;
        }

        try {
            setIsImporting(true);
            const stats = await api.importData(token, file);
            setImportStats(stats);
            toast.success('Importación completada con éxito');
        } catch (error) {
            console.error('Import error:', error);
            toast.error(error instanceof Error ? error.message : 'Error al importar datos');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Gestión de Datos y Portabilidad</h2>
            <p className="text-slate-500">
                Descarga una copia completa de tus registros médicos o restaura desde un respaldo anterior compatible.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                            <Download className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Exportar Información</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Descarga un archivo ZIP con todos tus pacientes y consultas en formato CSV compatible con Excel.
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        {isExporting ? 'Generando...' : 'Descargar Copia de Seguridad'}
                    </button>
                </div>

                {/* Import Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                            <Upload className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Restaurar Respaldo</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Sube un archivo ZIP generado previamente por Vitalinuage para restaurar tu historial médico.
                        </p>
                    </div>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".zip"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="w-full py-3 px-4 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                            {isImporting ? 'Procesando...' : 'Subir Archivo'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Import Stats Result Modal */}
            {importStats && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Importación Completada</h3>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Pacientes Totales:</span>
                                <span className="font-medium text-slate-900">{importStats.patients_processed}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Pacientes Nuevos:</span>
                                <span className="font-medium text-green-600">+{importStats.patients_inserted}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Consultas Insertadas:</span>
                                <span className="font-medium text-blue-600">+{importStats.consultations_inserted}</span>
                            </div>
                            {importStats.errors.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <h4 className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
                                        <AlertCircle className="w-3 h-3" /> Errores ({importStats.errors.length})
                                    </h4>
                                    <ul className="text-xs text-red-500 list-disc pl-4 max-h-20 overflow-y-auto">
                                        {importStats.errors.slice(0, 5).map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setImportStats(null)}
                            className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
