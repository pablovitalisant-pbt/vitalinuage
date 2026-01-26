
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientsList } from '../../hooks/usePatientsList';
import { User, ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react';

export default function PatientTable() {
    const { data, page, setPage, isLoading, error, setSearch, search } = usePatientsList();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        // Only trigger search if terms are actually different 
        // to avoid loops when page changes re-trigger this effect
        if (searchTerm === search) return;

        const delayDebounceFn = setTimeout(() => {
            setSearch(searchTerm);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, setSearch, search]);

    if (isLoading && !data && !searchTerm) {
        return <div className="p-8 text-center text-slate-500">Cargando pacientes...</div>;
    }

    if (error || !data) {
        return <div className="p-8 text-center text-red-500">Error al cargar la lista de pacientes.</div>;
    }

    const { data: patients, total, size } = data;
    const totalPages = Math.ceil(total / size);

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:border-blue-300 focus:ring focus:ring-blue-200 sm:text-sm transition duration-150 ease-in-out"
                    placeholder="Buscar por nombre o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {patients.length === 0 && searchTerm === "" ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
                    <User size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No hay pacientes registrados</h3>
                    <p className="text-slate-500 mb-6">Comienza registrando tu primer paciente.</p>
                    <button
                        onClick={() => navigate('/register')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Nuevo Paciente
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre Completo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Identificación</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Última Consulta</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {patients.length > 0 ? patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{patient.full_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-500">{patient.id_number}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {patient.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {patient.last_consultation ?
                                                new Date(patient.last_consultation).toLocaleDateString() :
                                                '-'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/patients/${patient.id}`, { state: { from: '/patients' } })}
                                                className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                            >
                                                <Eye size={16} /> Ver
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            No se encontraron pacientes para "{searchTerm}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-700">
                                    Mostrando <span className="font-medium">{Math.min((page - 1) * size + 1, total)}</span> a <span className="font-medium">{Math.min(page * size, total)}</span> de <span className="font-medium">{total}</span> resultados
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Anterior</span>
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages || totalPages === 0}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Siguiente</span>
                                        <ChevronRight size={20} />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

