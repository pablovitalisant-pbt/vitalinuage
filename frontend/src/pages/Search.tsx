import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PatientSearchSchema, PatientSearchQuery } from '../contracts/paciente_busqueda';


interface PatientResult {
    id: string;
    nombre_completo: string;
    dni: string;
    imc: number;
}

import { useDoctor } from '../context/DoctorContext';

export default function SearchPage() {
    const navigate = useNavigate();
    const { profile } = useDoctor();
    const [results, setResults] = useState<PatientResult[] | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [lastQuery, setLastQuery] = useState("");

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 13) return "Buenos días";
        if (hour >= 13 && hour < 20) return "Buenas tardes";
        return "Buenas noches";
    };

    const { register, handleSubmit } = useForm<PatientSearchQuery>({
        resolver: zodResolver(PatientSearchSchema),
    });

    const onSubmit = async (data: PatientSearchQuery) => {
        setSearchError(null);
        setResults(null);
        setHasSearched(true);
        setLastQuery(data.query);

        try {
            // Construct URL manually to avoid URLSearchParams encoding issues if any 
            // (though URLSearchParams is generally safer, keeping it simple as requested)
            const response = await fetch(`/api/pacientes/search?q=${encodeURIComponent(data.query)}`);

            if (response.status === 503) {
                setSearchError("El servicio de búsqueda no está disponible momentáneamente.");
                return;
            }

            if (!response.ok) {
                // If 404 it means no results generally in our API logic for search? 
                // Actually Slice 03 returns 404 if no patients found OR empty list.
                // Let's assume 200 OK with empty list or 404 means "Not Found".
                setResults([]);
                return;
            }

            const responseData = await response.json();
            setResults(responseData.results || []);

        } catch (err) {
            setSearchError("Error de conexión al buscar pacientes.");
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center pt-[20vh] font-sans px-4">
            {/* Dynamic Greeting Header */}
            <h1 className="text-4xl font-light text-slate-800 mb-8 tracking-tight">
                {getTimeBasedGreeting()}, <span className="font-semibold text-[#1e3a8a]">{profile.professionalName}</span>
            </h1>

            {/* Search Bar Container */}
            <div className="w-full max-w-2xl relative">
                <form onSubmit={handleSubmit(onSubmit)} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors" />
                    </div>
                    <input
                        {...register('query')}
                        type="text"
                        autoComplete="off"
                        placeholder="Buscar paciente por nombre o DNI..."
                        className="w-full pl-12 pr-4 py-3.5 rounded-full border border-gray-200 shadow-sm focus:shadow-md focus:border-transparent focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 text-lg"
                    />
                    {/* Hidden submit button to allow Enter key submission */}
                    <button type="submit" className="hidden" />
                </form>
            </div>

            {/* Results Area */}
            <div className="w-full max-w-2xl mt-8">
                {searchError && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-100 text-center">
                        {searchError}
                    </div>
                )}

                {hasSearched && !searchError && results && results.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                            <p className="text-sm text-gray-500">Resultados para <span className="font-semibold text-gray-700">"{lastQuery}"</span></p>
                        </div>
                        <ul>
                            {results.map((patient) => (
                                <li
                                    key={patient.id}
                                    onClick={() => navigate(`/patient/${patient.id}`)}
                                    className="border-b border-gray-50 last:border-none hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <div className="px-4 py-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-[#1e3a8a]">{patient.nombre_completo}</p>
                                            <p className="text-sm text-gray-500">DNI: {patient.dni}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.imc > 25 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                IMC: {patient.imc.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {hasSearched && !searchError && results && results.length === 0 && (
                    <div className="text-center mt-8">
                        <p className="text-gray-600 mb-4">No se encontró a <span className="font-semibold">"{lastQuery}"</span>.</p>
                        <button
                            onClick={() => navigate(`/register?name=${encodeURIComponent(lastQuery)}`)}
                            className="bg-[#1e3a8a] hover:bg-blue-900 text-white font-medium py-2 px-6 rounded-md transition-colors shadow-sm"
                        >
                            + Registrar a {lastQuery} como nuevo paciente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
