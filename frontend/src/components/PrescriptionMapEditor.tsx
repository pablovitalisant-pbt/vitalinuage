import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Save, Printer, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../config/api';
import { useAuthFetch } from '../hooks/useAuthFetch';

// A5 Dimensions in mm
const A5_WIDTH_MM = 148;
const A5_HEIGHT_MM = 210;

interface FieldConfig {
    field_key: string;
    label: string;
    x_mm: number;
    y_mm: number;
    font_size_pt: number;
    max_width_mm: number;
}

const DEFAULT_FIELDS: FieldConfig[] = [
    { field_key: 'patient_name', label: 'Nombre Paciente', x_mm: 20, y_mm: 40, font_size_pt: 12, max_width_mm: 80 },
    { field_key: 'patient_dni', label: 'DNI', x_mm: 100, y_mm: 40, font_size_pt: 12, max_width_mm: 30 },
    { field_key: 'date', label: 'Fecha', x_mm: 110, y_mm: 20, font_size_pt: 12, max_width_mm: 30 },
    { field_key: 'diagnosis', label: 'Diagnóstico', x_mm: 20, y_mm: 60, font_size_pt: 12, max_width_mm: 110 },
    { field_key: 'treatment', label: 'Tratamiento', x_mm: 20, y_mm: 90, font_size_pt: 12, max_width_mm: 110 },
    { field_key: 'doctor_signature', label: 'Firma y Sello', x_mm: 80, y_mm: 150, font_size_pt: 12, max_width_mm: 50 },
    { field_key: 'qr_code', label: 'Código QR', x_mm: 120, y_mm: 180, font_size_pt: 0, max_width_mm: 25 },
];

const PrescriptionMapEditor: React.FC = () => {
    const [featureEnabled, setFeatureEnabled] = useState<boolean | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [fields, setFields] = useState<FieldConfig[]>(DEFAULT_FIELDS);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [mapName, setMapName] = useState("Mi Talonario");
    const [mapId, setMapId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    const authFetch = useAuthFetch();

    // Feature Flag Check
    useEffect(() => {
        const checkFeatureFlag = async () => {
            try {
                // Static file fetch, using standard fetch is fine, but lets be consistent if possible.
                // Actually for public/static files standard fetch is okay, but authFetch won't hurt if it just ignores static.
                // However, authFetch appends Valid Token.
                const response = await fetch('/config/feature-flags.json');
                if (response.ok) {
                    const flags = await response.json();
                    setFeatureEnabled(flags.prescription_coords_v1 === true);
                } else {
                    setFeatureEnabled(false);
                }
            } catch (error) {
                console.error('Failed to load feature flags', error);
                setFeatureEnabled(false);
            }
        };
        checkFeatureFlag();
    }, []);

    // Initial Load
    useEffect(() => {
        if (featureEnabled === false) return;
        if (featureEnabled === null) return; // Wait for feature flag check

        const fetchMap = async () => {
            try {
                const response = await authFetch(getApiUrl('/api/maps'));

                if (response.ok) {
                    const data = await response.json();
                    // API returns array, get first active map
                    const activeMap = Array.isArray(data) ? data.find((m: any) => m.is_active) || data[0] : data;

                    if (activeMap) {
                        setMapId(activeMap.id);
                        setMapName(activeMap.name);

                        const savedFields = activeMap.fields_config;
                        const mergedFields = DEFAULT_FIELDS.map(def => {
                            const existing = savedFields.find((f: any) => f.field_key === def.field_key);
                            return existing || def;
                        });
                        setFields(mergedFields);

                        if (activeMap.background_image_url) {
                            setBackgroundImage(activeMap.background_image_url);
                        }
                    }
                } else if (response.status === 404) {
                    console.log('No map configured yet');
                }
            } catch (error) {
                console.error("Failed to fetch map", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMap();
    }, [featureEnabled]);

    // ... (rest of component) ...

    const saveMap = async () => {
        setSaving(true);

        const mapData = {
            name: mapName,
            canvas_width_mm: A5_WIDTH_MM,
            canvas_height_mm: A5_HEIGHT_MM,
            fields_config: fields,
            is_active: true
        };

        try {
            const response = await authFetch(getApiUrl('/api/maps'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mapData)
            });

            if (response.ok) {
                const data = await response.json();
                setMapId(data.id);
                alert('Mapa guardado exitosamente');
            } else {
                const errorText = await response.text();
                console.error('Error saving map', errorText);
                alert('Error guardando mapa');
            }
        } catch (error) {
            console.error('Error saving map', error);
            alert('Error conectando con servidor');
        } finally {
            setSaving(false);
        }
    };

    const handleDebugPrint = () => {
        if (!mapId) {
            alert("Primero guarda el mapa");
            return;
        }
        const consultationId = prompt("Ingresa un ID de consulta existente para probar:", "1");
        if (consultationId) {
            window.open(getApiUrl(`/api/print/mapped/${consultationId}?map_id=${mapId}&debug=true`), '_blank');
        }
    };

    // Feature Flag Guard
    if (featureEnabled === null) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-500">Cargando...</div>
            </div>
        );
    }

    if (featureEnabled === false) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                        <h3 className="text-lg font-semibold text-yellow-800">Funcionalidad no disponible</h3>
                    </div>
                    <p className="text-sm text-yellow-700">
                        El editor de mapas de impresión está desactivado. Contacta al administrador del sistema.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-500">Cargando configuración...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 p-6 h-[calc(100vh-100px)]">
            {/* Controls Sidebar */}
            <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-md flex flex-col gap-4 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Editor de Mapas de Impresión</h2>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Nombre del Mapa</label>
                    <input
                        type="text"
                        value={mapName}
                        onChange={(e) => setMapName(e.target.value)}
                        className="p-2 border rounded"
                    />
                </div>

                <div className="p-4 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-gray-50 relative">
                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Subir foto del talonario</span>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                    <h3 className="font-semibold">Campos Disponibles</h3>
                    <p className="text-xs text-gray-500 mb-2">Selecciona un campo para moverlo con el teclado</p>
                    {fields.map(field => (
                        <div
                            key={field.field_key}
                            onClick={() => setSelectedField(field.field_key)}
                            className={`p-2 rounded cursor-pointer border flex justify-between items-center ${selectedField === field.field_key ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'
                                }`}
                        >
                            <span className="text-sm">{field.label}</span>
                            <span className="text-xs text-gray-400">
                                {field.x_mm.toFixed(1)}, {field.y_mm.toFixed(1)} mm
                            </span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={saveMap}
                    disabled={saving}
                    className="mt-auto bg-blue-600 text-white p-3 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                >
                    <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
                {mapId && (
                    <button onClick={handleDebugPrint} className="bg-gray-800 text-white p-3 rounded-md flex items-center justify-center gap-2 hover:bg-gray-900">
                        <Printer size={20} /> Prueba de Impresión (Debug)
                    </button>
                )}
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center p-8 overflow-auto">
                <div
                    ref={canvasRef}
                    className="bg-white shadow-2xl relative select-none"
                    style={{
                        aspectRatio: `${A5_WIDTH_MM}/${A5_HEIGHT_MM}`,
                        height: '100%',
                        maxHeight: '800px',
                        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {!backgroundImage && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                            Sin imagen de fondo
                        </div>
                    )}

                    {fields.map(field => (
                        <div
                            key={field.field_key}
                            style={getStyle(field)}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedField(field.field_key);
                                setIsDragging(true);
                            }}
                            className={`absolute border border-dashed flex items-center px-1 cursor-move text-xs whitespace-nowrap overflow-hidden
                        ${selectedField === field.field_key ? 'border-blue-600 bg-blue-100/50 text-blue-800 z-10' : 'border-gray-400 bg-white/50 text-gray-600'}
                    `}
                        >
                            {field.field_key === 'qr_code' ? (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                    QR
                                </div>
                            ) : (
                                field.label
                            )}
                            <div
                                className="absolute bottom-0 right-0 w-2 h-2 bg-black opacity-20 cursor-se-resize"
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                }}
                            ></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PrescriptionMapEditor;
