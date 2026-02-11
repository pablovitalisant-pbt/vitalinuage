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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" data-testid="vital-signs-grid">

            {/* IMC Card - Compact */}
            <div
                className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col"
                data-testid="imc-card"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className={`p-1.5 rounded-md ${getIMCIconColor(imc)}`}>
                        <Activity size={14} strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">IMC</span>
                </div>
                <div className="mt-auto">
                    <div className="text-lg font-semibold text-slate-800 mb-1 tracking-tight">
                        {imc ? imc.toFixed(1) : '--'}
                    </div>
                    <div
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide border ${getIMCColor(imc)}`}
                        data-testid="imc-indicator"
                    >
                        {getIMCLabel(imc)}
                    </div>
                </div>
            </div>

            {/* Blood Pressure Card - Compact */}
            <div
                className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col"
                data-testid="vital-card-bp"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                        <Heart size={14} strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Presión</span>
                </div>
                <div className="mt-auto">
                    <div className="text-base font-semibold text-slate-800 tracking-tight">
                        {bloodPressure || '--/--'}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-medium">mmHg</div>
                </div>
            </div>

            {/* Weight/Height Card - Compact */}
            <div
                className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col"
                data-testid="vital-card-weight"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                        <Weight size={14} strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Peso</span>
                </div>
                <div className="mt-auto">
                    <div className="text-base font-semibold text-slate-800 tracking-tight">
                        {weight ? `${weight} kg` : '--'}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-medium">
                        {height ? `${height} cm` : '--'}
                    </div>
                </div>
            </div>

            {/* Last Consultation Card - Compact */}
            <div
                className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col"
                data-testid="vital-card-last"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                        <Calendar size={14} strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Última</span>
                </div>
                <div className="mt-auto">
                    <div className="text-xs font-semibold text-slate-800 tracking-tight">
                        {lastConsultationDate
                            ? new Date(lastConsultationDate).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short'
                            })
                            : 'Sin datos'
                        }
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-semibold">Consulta</div>
                </div>
            </div>
        </div>
    );
}
