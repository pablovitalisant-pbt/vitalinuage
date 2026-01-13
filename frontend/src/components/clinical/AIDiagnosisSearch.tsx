
import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

import { getApiUrl } from '../../config/api';

interface Suggestion {
    code: string;
    description: string;
    relevance_reason: string;
}

interface AIDiagnosisSearchProps {
    onSelect: (code: string, description: string) => void;
}

export default function AIDiagnosisSearch({ onSelect }: AIDiagnosisSearchProps) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const [isOpen, setIsOpen] = useState(false);

    // Debounce Logic
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    // API Call Logic
    useEffect(() => {
        const fetchDiagnosis = async () => {
            if (!debouncedQuery || debouncedQuery.length < 3) {
                setSuggestions([]);
                setIsOpen(false);
                return;
            }

            setLoading(true);
            setIsOpen(true);
            try {
                const response = await fetch(getApiUrl('/api/diagnosis/suggest-cie10'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: debouncedQuery })
                });

                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data.suggestions || []);
                } else {
                    console.error("Diagnosis API Error");
                }
            } catch (error) {
                console.error("Network Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDiagnosis();
    }, [debouncedQuery]);

    return (
        <div className="relative w-full mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnóstico Presuntivo (IA)
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {loading ? <Loader2 className="h-5 w-5 text-blue-500 animate-spin" /> : <Search className="h-5 w-5 text-gray-400" />}
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Escriba síntomas o diagnóstico (Ej: Dolor lumbar...)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {suggestions.map((s) => (
                        <li
                            key={s.code}
                            className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                            onClick={() => {
                                onSelect(s.code, s.description);
                                setQuery(`${s.code} - ${s.description}`);
                                setIsOpen(false);
                            }}
                        >
                            <div className="flex items-center">
                                <span className="font-bold text-blue-800 w-16">{s.code}</span>
                                <span className="text-gray-700">{s.description}</span>
                            </div>
                            <span className="block text-xs text-gray-400 ml-16 truncate">{s.relevance_reason}</span>
                        </li>
                    ))}
                    <li className="text-xs text-center py-2 text-gray-400 border-t bg-gray-50">
                        Sugerencias generadas por Gemini AI
                    </li>
                </ul>
            )}

            {/* Loading State without suggestions */}
            {isOpen && loading && suggestions.length === 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-4 text-sm text-gray-500">
                    Buscando sugerencias...
                </div>
            )}
        </div>
    );
}
