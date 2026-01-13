import { Activity, Heart, Weight, Calendar } from 'lucide-react';

interface VitalSignsProps {
    imc?: number;
    bloodPressure?: string;
    weight?: number;
    height?: number;
    lastConsultationDate?: string;
}

export default function VitalSignsCards({ imc, bloodPressure, weight, height, lastConsultationDate }: VitalSignsProps) {

    // IMC Color Logic
    const getIMCColor = (imcValue?: number) => {
        if (!imcValue) return 'bg-slate-50 text-slate-600 border-slate-200';
        if (imcValue < 25) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (imcValue <= 30) return 'bg-orange-50 text-orange-700 border-orange-200';
        return 'bg-red-50 text-red-700 border-red-200';
    };

    const getIMCLabel = (imcValue?: number) => {
        if (!imcValue) return 'No registrado';
        if (imcValue < 25) return 'Normal';
        if (imcValue <= 30) return 'Sobrepeso';
        return 'Obesidad';
    };

    const getIMCIconColor = (imcValue?: number) => {
        if (!imcValue) return 'bg-slate-100 text-slate-600';
        if (imcValue < 25) return 'bg-emerald-100 text-emerald-600';
        if (imcValue <= 30) return 'bg-orange-100 text-orange-600';
        return 'bg-red-100 text-red-600';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="vital-signs-grid">

            {/* IMC Card */}
            <div
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col"
                data-testid="imc-card"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${getIMCIconColor(imc)}`}>
                        <Activity size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">IMC</span>
                </div>
                <div className="mt-auto">
                    <div className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
                        {imc ? imc.toFixed(1) : '--'}
                    </div>
                    <div
                        className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border ${getIMCColor(imc)}`}
                        data-testid="imc-indicator"
                    >
                        {getIMCLabel(imc)}
                    </div>
                </div>
            </div>

            {/* Blood Pressure Card */}
            <div
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col"
                data-testid="vital-card-bp"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-rose-100 rounded-2xl text-rose-600">
                        <Heart size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Presión</span>
                </div>
                <div className="mt-auto">
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                        {bloodPressure || '--/--'}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 font-semibold">mmHg</div>
                </div>
            </div>

            {/* Weight/Height Card */}
            <div
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col"
                data-testid="vital-card-weight"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-violet-100 rounded-2xl text-violet-600">
                        <Weight size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Peso/Talla</span>
                </div>
                <div className="mt-auto">
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                        {weight ? `${weight} kg` : '--'}
                    </div>
                    <div className="text-sm text-slate-600 mt-2 font-semibold">
                        {height ? `${height} cm` : '--'}
                    </div>
                </div>
            </div>

            {/* Last Consultation Card */}
            <div
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col"
                data-testid="vital-card-last"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-sky-100 rounded-2xl text-sky-600">
                        <Calendar size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Última</span>
                </div>
                <div className="mt-auto">
                    <div className="text-sm font-black text-slate-900 tracking-tight">
                        {lastConsultationDate
                            ? new Date(lastConsultationDate).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })
                            : 'Sin consultas'
                        }
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-semibold">Consulta</div>
                </div>
            </div>
        </div>
    );
}
