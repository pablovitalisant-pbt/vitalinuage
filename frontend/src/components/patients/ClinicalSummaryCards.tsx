import { Droplet, AlertCircle, Activity, Pill } from 'lucide-react';

interface ClinicalRecord {
    blood_type: string | null;
    allergies: string[];
    chronic_conditions: string[];
    current_medications: string[];
}

interface ClinicalSummaryCardsProps {
    data: ClinicalRecord;
    isEditing: boolean;
    onUpdate: (field: keyof ClinicalRecord, value: any) => void;
}

export default function ClinicalSummaryCards({ data, isEditing, onUpdate }: ClinicalSummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Blood Type */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600 mr-3">
                        <Droplet size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Grupo Sanguíneo</h3>
                </div>
                {isEditing ? (
                    <select
                        className="w-full mt-auto block pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                        value={data.blood_type || ""}
                        onChange={e => onUpdate('blood_type', e.target.value || null)}
                    >
                        <option value="">Seleccionar...</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                    </select>
                ) : (
                    <div className="text-3xl font-bold text-slate-800 mt-auto">
                        {data.blood_type || <span className="text-slate-400 text-lg font-normal">No registrado</span>}
                    </div>
                )}
            </div>

            {/* Allergies */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600 mr-3">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Alergias</h3>
                </div>
                {isEditing ? (
                    <div className="mt-auto">
                        <label className="block text-xs text-slate-500 mb-1">Separadas por comas</label>
                        <textarea
                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 h-24"
                            value={data.allergies.join(", ")}
                            onChange={e => onUpdate('allergies', e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                            placeholder="Ej. Penicilina, Maní..."
                        />
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2 mt-auto">
                        {data.allergies && data.allergies.length > 0 ? (
                            data.allergies.map((allergy, idx) => (
                                <span key={idx} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200">
                                    {allergy}
                                </span>
                            ))
                        ) : (
                            <p className="text-slate-400 italic">Sin alergias conocidas</p>
                        )}
                    </div>
                )}
            </div>

            {/* Chronic Conditions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-3">
                        <Activity size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Condiciones Crónicas</h3>
                </div>
                {isEditing ? (
                    <div className="mt-auto">
                        <label className="block text-xs text-slate-500 mb-1">Separadas por comas</label>
                        <textarea
                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 h-24"
                            value={data.chronic_conditions.join(", ")}
                            onChange={e => onUpdate('chronic_conditions', e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                            placeholder="Ej. Hipertensión, Diabetes..."
                        />
                    </div>
                ) : (
                    <div className="mt-auto">
                        {data.chronic_conditions && data.chronic_conditions.length > 0 ? (
                            <ul className="space-y-2">
                                {data.chronic_conditions.map((condition, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                                        <span className="text-slate-700 leading-snug">{condition}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-slate-400 italic">Sin condiciones registradas</p>
                        )}
                    </div>
                )}
            </div>

            {/* Current Medications */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 mr-3">
                        <Pill size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Medicación Actual</h3>
                </div>
                {isEditing ? (
                    <div className="mt-auto">
                        <label className="block text-xs text-slate-500 mb-1">Separadas por comas</label>
                        <textarea
                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 h-24"
                            value={data.current_medications.join(", ")}
                            onChange={e => onUpdate('current_medications', e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                            placeholder="Ej. Ibuprofeno 400mg, Insulina..."
                        />
                    </div>
                ) : (
                    <div className="mt-auto">
                        {data.current_medications && data.current_medications.length > 0 ? (
                            <div className="space-y-3">
                                {data.current_medications.map((med, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 shadow-sm">
                                        {med}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400 italic">No consume medicación</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
