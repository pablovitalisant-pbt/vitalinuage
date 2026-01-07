import React from 'react';
import { Users, Calendar, CheckSquare, Activity, FileText, BarChart2, TrendingUp } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import { useDashboardStats } from '../hooks/useDashboardStats';

export default function DashboardPage() {
    const { stats, isLoading, error } = useDashboardStats();

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Cargando resumen...</div>;
    }

    if (error || !stats) {
        return <div className="p-8 text-center text-red-500">Error cargando datos del tablero.</div>;
    }

    const maxFlow = Math.max(...(stats.weekly_patient_flow || [0]), 1);
    const dayLabels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('es-ES', { weekday: 'short' });
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
                    <p className="text-sm text-slate-500">Resumen y métricas clave</p>
                </div>
                <span className="text-sm text-slate-500 font-medium bg-white px-3 py-1 rounded-full border border-slate-200">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Pacientes"
                    value={stats.total_patients}
                    icon={<Users size={24} />}
                />
                <StatsCard
                    title="Citas de Hoy"
                    value={stats.appointments_today}
                    icon={<Calendar size={24} />}
                />
                <StatsCard
                    title="Recetas Emitidas"
                    value={stats.total_prescriptions}
                    icon={<FileText size={24} />}
                    trend="+5 recientes" // Placeholder or we could compute real trend
                />
                <StatsCard
                    title="Eficacia"
                    value={`${stats.efficiency_rate}%`}
                    icon={<TrendingUp size={24} />}
                    trend="Conv. Recetas" // Label
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Flow Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <BarChart2 size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">Flujo de Pacientes (7 días)</h3>
                        </div>
                    </div>

                    <div className="h-48 flex items-end justify-between gap-2">
                        {stats.weekly_patient_flow?.map((val, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-blue-100 rounded-t-sm hover:bg-blue-200 transition-all relative group-hover:shadow-md"
                                    style={{ height: `${(val / maxFlow) * 100}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {val} citas
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 capitalize">{dayLabels[idx]}</span>
                            </div>
                        ))}
                        {(!stats.weekly_patient_flow || stats.weekly_patient_flow.length === 0) && (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 italic">
                                Sin datos suficientes
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800">Actividad Reciente</h3>
                        <Activity size={20} className="text-slate-400" />
                    </div>
                    <div className="divide-y divide-slate-100">
                        {stats.recent_activity.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">No hay actividad reciente.</div>
                        ) : (
                            stats.recent_activity.map((item, index) => (
                                <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{item.patient_name}</p>
                                            <p className="text-xs text-slate-500">{item.action}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
