import React, { useEffect, useState } from 'react';
import apiConfig from '../config/api';
import { DispatchAuditResponse } from '../contracts/audit';
import { Mail, MessageCircle, AlertCircle } from 'lucide-react';
import { useAuthFetch } from '../hooks/useAuthFetch';

export default function AuditPanel() {
    const [data, setData] = useState<DispatchAuditResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('all');

    const authFetch = useAuthFetch();

    const handleSearch = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('start_date', new Date(startDate).toISOString());
            if (endDate) queryParams.append('end_date', new Date(endDate).toISOString());
            if (status !== 'all') queryParams.append('status', status);

            const res = await authFetch(`${apiConfig.apiBaseUrl}/api/audit/dispatch-summary?${queryParams.toString()}`);

            if (res.status === 404) {
                throw new Error("Audit Panel is disabled or not found.");
            }
            if (!res.ok) throw new Error("Failed to load audit data");

            const json: DispatchAuditResponse = await res.json();
            setData(json);
        } catch (err: any) {
            if (err.message !== 'AUTH_TOKEN_MISSING' && err.message !== 'AUTH_401') {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!data) return;
        const headers = ["Fecha,Paciente,Medico,Email Sent,WhatsApp Sent\n"];
        const rows = data.items.map(i =>
            `${i.issue_date},"${i.patient_name}","${i.doctor_name}",${i.email_sent_at || ''},${i.whatsapp_sent_at || ''}`
        );
        const blob = new Blob([headers + rows.join("\n")], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    useEffect(() => {
        handleSearch();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading audit data...</div>;
    if (error) return <div className="p-8 text-red-500 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Panel de Auditoría de Despachos</h1>

            {/* Filters Toolbar */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                        type="date"
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => {
                            // Minimal implementation to trigger fetch? Or button? 
                            // For now, let's keep it simple and just reload or add a search button. 
                            // Better: Add state for filters and Search button.
                        }}
                    />
                </div>
                {/* 
                   Wait, I need to implement the STATE for filters first. 
                   The previous code didn't have filter state. I need to replace more lines to add state.
                   Retrying with a larger block replacement.
                 */}
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
                    >
                        <option value="all">Todos</option>
                        <option value="pending">Pendientes</option>
                        <option value="sent">Enviados</option>
                    </select>
                </div>
                <button
                    onClick={handleSearch}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    Filtrar
                </button>
                <div className="flex-grow"></div>
                <button
                    onClick={handleExport}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                    <span>⬇ CSV</span>
                </button>
            </div>

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
