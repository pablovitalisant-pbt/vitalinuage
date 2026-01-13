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
        if (!imcValue) return 'bg-slate-100 text-slate-600';
        if (imcValue < 25) return 'bg-green-100 text-green-700';
        if (imcValue <= 30) return 'bg-orange-100 text-orange-700';
        return 'bg-red-100 text-red-700';
    };

    const getIMCLabel = (imcValue?: number) => {
        if (!imcValue) return 'No registrado';
        if (imcValue < 25) return 'Normal';
        if (imcValue <= 30) return 'Sobrepeso';
        return 'Obesidad';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="vital-signs-grid">

            {/* IMC Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col" data-testid="imc-card">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Activity size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">IMC</span>
                </div>
                <div className="mt-auto">
                    <div className="text-3xl font-bold text-slate-800 mb-2">
                        {imc ? imc.toFixed(1) : '--'}
                    </div>
                    <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getIMCColor(imc)}`}
                        data-testid="imc-indicator"
                    >
                        {getIMCLabel(imc)}
                    </div>
                </div>
            </div>

            {/* Blood Pressure Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col" data-testid="vital-card-bp">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <Heart size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Presión</span>
                </div>
                <div className="mt-auto">
                    <div className="text-2xl font-bold text-slate-800">
                        {bloodPressure || '--/--'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">mmHg</div>
                </div>
            </div>

            {/* Weight/Height Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col" data-testid="vital-card-weight">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <Weight size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Peso/Talla</span>
                </div>
                <div className="mt-auto">
                    <div className="text-2xl font-bold text-slate-800">
                        {weight ? `${weight} kg` : '--'}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                        {height ? `${height} cm` : '--'}
                    </div>
                </div>
            </div>

            {/* Last Consultation Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col" data-testid="vital-card-last">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                        <Calendar size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Última Consulta</span>
                </div>
                <div className="mt-auto">
                    <div className="text-sm font-semibold text-slate-800">
                        {lastConsultationDate
                            ? new Date(lastConsultationDate).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })
                            : 'Sin consultas'
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
