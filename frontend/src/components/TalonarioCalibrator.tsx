import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Save, Printer, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move } from 'lucide-react';

// A5 Dimensions in mm
const A5_WIDTH_MM = 148;
const A5_HEIGHT_MM = 210;
const ASPECT_RATIO = A5_WIDTH_MM / A5_HEIGHT_MM;

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
];

export const TalonarioCalibrator: React.FC = () => {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [fields, setFields] = useState<FieldConfig[]>(DEFAULT_FIELDS);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [mapName, setMapName] = useState("Mi Talonario");
    const [mapId, setMapId] = useState<string | null>(null); // Lifted state
    const canvasRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const fetchMap = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/maps');
                if (response.ok) {
                    const data = await response.json();
                    setMapId(data.id);
                    setMapName(data.name);

                    // Merge saved fields with current default fields to ensure new features (like signature) appear
                    // If a default field is not in saved config, add it. If it is, keep saved config.
                    const savedFields = data.fields_config;
                    const mergedFields = DEFAULT_FIELDS.map(def => {
                        const existing = savedFields.find((f: any) => f.field_key === def.field_key);
                        return existing || def;
                    });
                    setFields(mergedFields);

                    if (data.background_image_path) {
                        // Assuming backend serves static files correctly
                        setBackgroundImage(`http://127.0.0.1:8000${data.background_image_path}`);
                    }
                } else {
                    // 404 is expected if not configured yet, just keep defaults
                    console.log('No map configured yet');
                }
            } catch (error) {
                console.error("Failed to fetch map", error);
            }
        };
        fetchMap();
    }, []);

    // Load image from file input
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            setBackgroundImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Convert mm to % for display
    const getStyle = (field: FieldConfig) => ({
        left: `${(field.x_mm / A5_WIDTH_MM) * 100}%`,
        top: `${(field.y_mm / A5_HEIGHT_MM) * 100}%`,
        fontSize: `${field.font_size_pt}pt`, // This is approximate for visual representation
    });

    // Handle Dragging
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !selectedField || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert px -> mm
        const x_mm = (x / rect.width) * A5_WIDTH_MM;
        const y_mm = (y / rect.height) * A5_HEIGHT_MM;

        setFields(prev => prev.map(f =>
            f.field_key === selectedField
                ? { ...f, x_mm: Math.max(0, Math.min(x_mm, A5_WIDTH_MM)), y_mm: Math.max(0, Math.min(y_mm, A5_HEIGHT_MM)) }
                : f
        ));
    }, [isDragging, selectedField]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Keyboard fine-tuning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedField) return;

            const STEP_MM = 0.5; // Fine tune step

            setFields(prev => prev.map(f => {
                if (f.field_key !== selectedField) return f;
                let { x_mm, y_mm } = f;

                switch (e.key) {
                    case 'ArrowUp': y_mm -= STEP_MM; break;
                    case 'ArrowDown': y_mm += STEP_MM; break;
                    case 'ArrowLeft': x_mm -= STEP_MM; break;
                    case 'ArrowRight': x_mm += STEP_MM; break;
                    default: return f;
                }
                return { ...f, x_mm, y_mm };
            }));
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedField]);




    const saveMap = async () => {
        const formData = new FormData();
        const mapData = {
            name: mapName,
            canvas_width_mm: A5_WIDTH_MM,
            canvas_height_mm: A5_HEIGHT_MM,
            fields_config: fields
        };

        formData.append('data', JSON.stringify(mapData));
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/api/maps', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setMapId(data.id);
                alert('Mapa guardado exitosamente');
            } else {
                console.error('Error saving map', await response.text());
                alert('Error guardando mapa');
            }
        } catch (error) {
            console.error('Error saving map', error);
            alert('Error conectando con servidor');
        }
    };

    const handleDebugPrint = () => {
        if (!mapId) {
            alert("Primero guarda el mapa");
            return;
        }
        const consultationId = prompt("Ingresa un ID de consulta existente para probar:", "consultation-id");
        if (consultationId) {
            window.open(`http://127.0.0.1:8000/api/print/mapped/${consultationId}?map_id=${mapId}&debug=true`, '_blank');
        }
    };


    return (
        <div className="flex flex-col md:flex-row gap-6 p-6 h-[calc(100vh-100px)]">
            {/* Controls Sidebar */}
            <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-md flex flex-col gap-4 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Calibrador de Talonario</h2>

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

                <button onClick={saveMap} className="mt-auto bg-blue-600 text-white p-3 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700">
                    <Save size={20} /> Guardar Configuración
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
                        maxHeight: '800px', // Prevent too large on big screens
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
                                e.stopPropagation(); // Prevent bubbling if necessary
                                setSelectedField(field.field_key);
                                setIsDragging(true);
                            }}
                            className={`absolute border border-dashed flex items-center px-1 cursor-move text-xs whitespace-nowrap overflow-hidden
                        ${selectedField === field.field_key ? 'border-blue-600 bg-blue-100/50 text-blue-800 z-10' : 'border-gray-400 bg-white/50 text-gray-600'}
                    `}
                        >
                            {field.label}
                            <div
                                className="absolute bottom-0 right-0 w-2 h-2 bg-black opacity-20 cursor-se-resize"
                                onMouseDown={(e) => {
                                    // Future: Implement resize
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
