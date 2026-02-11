export type MedicationItem = {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
};

export type ParseRecetaResult =
    | { ok: true; medications: MedicationItem[] }
    | { ok: false; error: string };

export type RecetaSubmitFlowInput = {
    recetaText: string;
    parseReceta: (text: string) => ParseRecetaResult;
    postConsultation: () => Promise<{ consultation_id: number } | { id: number }>;
    postPrescription: (consultationId: number, medications: MedicationItem[]) => Promise<void>;
};

export type RecetaSubmitFlowResult =
    | { ok: true }
    | { ok: false; error: string };

export async function runRecetaSubmitFlow(input: RecetaSubmitFlowInput): Promise<RecetaSubmitFlowResult> {
    const parseResult = input.parseReceta(input.recetaText);
    if (!parseResult.ok) {
        return { ok: false, error: parseResult.error };
    }

    const consultationResult = await input.postConsultation();
    const consultationId =
        'id' in consultationResult ? consultationResult.id : consultationResult.consultation_id;

    // If API does not return an id, stop and surface a deterministic error
    if (!consultationId) {
        return { ok: false, error: 'No consultation id returned' };
    }

    if (parseResult.medications.length > 0) {
        await input.postPrescription(consultationId, parseResult.medications);
    }

    return { ok: true };
}
