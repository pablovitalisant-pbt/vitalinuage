import React, { useEffect, useState } from 'react';
import apiConfig from '../config/api';
import { DispatchAuditResponse } from '../contracts/audit';
import { Mail, MessageCircle, AlertCircle } from 'lucide-react';

export default function AuditPanel() {
    const [data, setData] = useState<DispatchAuditResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${apiConfig.apiBaseUrl}/api/audit/dispatch-summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 404) {
                    throw new Error("Audit Panel is disabled or not found.");
                }
                if (!res.ok) throw new Error("Failed to load audit data");

                const json: DispatchAuditResponse = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAudit();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading audit data...</div>;
    if (error) return <div className="p-8 text-red-500 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Panel de Auditoría de Despachos</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canales</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data?.items.map((item) => (
                            <tr key={item.uuid} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(item.issue_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.patient_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.doctor_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-4">
                                    <span className={`flex items-center gap-1 ${item.email_sent_at ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                                        <Mail className="w-4 h-4" /> {item.email_sent_at ? 'Enviado' : 'Pendiente'}
                                    </span>
                                    <span className={`flex items-center gap-1 ${item.whatsapp_sent_at ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                                        <MessageCircle className="w-4 h-4" /> {item.whatsapp_sent_at ? 'Enviado' : 'Pendiente'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-500 bg-gray-50">
                    Total: {data?.total_count} registros encontrados
                </div>
            </div>
        </div>
    );
}
