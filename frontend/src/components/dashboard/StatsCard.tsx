
import React, { ReactNode } from 'react';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: ReactNode;
    trend?: string;
}

export default function StatsCard({ title, value, icon, trend }: StatsCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                {trend && (
                    <span className="inline-flex items-center text-xs font-medium text-green-600 mt-2 bg-green-50 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                {icon}
            </div>
        </div>
    );
}
