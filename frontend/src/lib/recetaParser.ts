export type MedicationItem = {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
};

export type ParseRecetaResult =
    | { ok: true; medications: MedicationItem[] }
    | { ok: false; error: string };

export function parseRecetaToMedications(text: string): ParseRecetaResult {
    const trimmed = text.trim();
    if (!trimmed) {
        return { ok: true, medications: [] };
    }

    const errorMessage = "Cada línea debe tener 4 campos separados por '|': Nombre | Dosis | Frecuencia | Duración";
    const medications: MedicationItem[] = [];

    const lines = text.split('\n');
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const parts = line.split('|').map((part) => part.trim());
        if (parts.length !== 4) {
            return { ok: false, error: errorMessage };
        }

        const [name, dosage, frequency, duration] = parts;
        medications.push({ name, dosage, frequency, duration });
    }

    return { ok: true, medications };
}
