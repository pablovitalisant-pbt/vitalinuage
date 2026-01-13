
import React, { useState, useEffect } from 'react';

interface BiometryFormProps {
    onChange: (data: any) => void;
    initialData?: any;
}

export default function BiometryForm({ onChange, initialData }: BiometryFormProps) {
    const [formData, setFormData] = useState({
        peso_kg: initialData?.peso_kg || '',
        estatura_cm: initialData?.estatura_cm || '',
        presion_arterial: initialData?.presion_arterial || '',
        frecuencia_cardiaca: initialData?.frecuencia_cardiaca || '',
        temperatura_c: initialData?.temperatura_c || '',
        imc: initialData?.imc || ''
    });

    const calculateIMC = (weight: number, height: number): number | null => {
        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
        }
        return null;
    };

    const getIMCColor = (imc: number) => {
        if (imc < 25) return 'text-green-600';
        if (imc < 30) return 'text-orange-500';
        return 'text-red-600';
    };

    const handleChange = (field: string, value: string) => {
        const updatedData = { ...formData, [field]: value };

        if (field === 'peso_kg' || field === 'estatura_cm') {
            const w = field === 'peso_kg' ? parseFloat(value) : parseFloat(formData.peso_kg);
            const h = field === 'estatura_cm' ? parseFloat(value) : parseFloat(formData.estatura_cm);

            const newIMC = calculateIMC(w, h);
            if (newIMC) {
                updatedData.imc = newIMC.toString();
            }
        }

        setFormData(updatedData);
        onChange(updatedData);
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">

            {/* Peso */}
            <div>
                <label htmlFor="peso" className="block text-sm font-medium text-gray-700">Peso (kg)</label>
                <input
                    id="peso"
                    type="number"
                    step="0.1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white border"
                    value={formData.peso_kg}
                    onChange={(e) => handleChange('peso_kg', e.target.value)}
                    placeholder="Ej: 70.5"
                />
            </div>

            {/* Estatura */}
            <div>
                <label htmlFor="estatura" className="block text-sm font-medium text-gray-700">Estatura (cm)</label>
                <input
                    id="estatura"
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white border"
                    value={formData.estatura_cm}
                    onChange={(e) => handleChange('estatura_cm', e.target.value)}
                    placeholder="Ej: 175"
                />
            </div>

            {/* IMC Display (Read Only) */}
            <div className="flex flex-col justify-end pb-2">
                <span className="text-sm text-gray-500">IMC Calculado:</span>
                {formData.imc ? (
                    <span className={`text-xl font-bold ${getIMCColor(parseFloat(formData.imc))}`}>
                        {formData.imc}
                    </span>
                ) : (
                    <span className="text-gray-400 text-sm italic">Pendiente de datos</span>
                )}
            </div>

            {/* Presion */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Presión Arterial</label>
                <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white border"
                    value={formData.presion_arterial}
                    onChange={(e) => handleChange('presion_arterial', e.target.value)}
                    placeholder="Ej: 120/80"
                />
            </div>

            {/* FC */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Frec. Cardíaca (lpm)</label>
                <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white border"
                    value={formData.frecuencia_cardiaca}
                    onChange={(e) => handleChange('frecuencia_cardiaca', e.target.value)}
                    placeholder="Ej: 70"
                />
            </div>

            {/* Temp */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Temp (°C)</label>
                <input
                    type="number"
                    step="0.1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white border"
                    value={formData.temperatura_c}
                    onChange={(e) => handleChange('temperatura_c', e.target.value)}
                    placeholder="Ej: 36.5"
                />
            </div>

        </div>
    );
}
