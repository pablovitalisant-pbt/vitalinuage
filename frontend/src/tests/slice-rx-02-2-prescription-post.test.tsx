import { parseRecetaToMedications } from '../lib/recetaParser';
import { runRecetaSubmitFlow } from '../lib/recetaSubmitFlow';

describe('RX-02-2 runRecetaSubmitFlow', () => {
    it('invalid receta does not call any post and returns error', async () => {
        const postConsultation = jest.fn();
        const postPrescription = jest.fn();

        const result = await runRecetaSubmitFlow({
            recetaText: 'Paracetamol | 500 mg | cada 8 horas',
            parseReceta: parseRecetaToMedications,
            postConsultation,
            postPrescription
        });

        expect(result).toEqual({
            ok: false,
            error: "Cada línea debe tener 4 campos separados por '|': Nombre | Dosis | Frecuencia | Duración"
        });
        expect(postConsultation).not.toHaveBeenCalled();
        expect(postPrescription).not.toHaveBeenCalled();
    });

    it('valid receta posts consultation then prescription', async () => {
        const postConsultation = jest.fn().mockResolvedValue({ id: 123 });
        const postPrescription = jest.fn().mockResolvedValue(undefined);

        const result = await runRecetaSubmitFlow({
            recetaText: 'Paracetamol | 500 mg | cada 8 horas | 5 días',
            parseReceta: parseRecetaToMedications,
            postConsultation,
            postPrescription
        });

        expect(result).toEqual({ ok: true });
        expect(postConsultation).toHaveBeenCalledTimes(1);
        expect(postPrescription).toHaveBeenCalledTimes(1);
        expect(postPrescription).toHaveBeenCalledWith(123, [
            {
                name: 'Paracetamol',
                dosage: '500 mg',
                frequency: 'cada 8 horas',
                duration: '5 días'
            }
        ]);
    });

    it('empty receta posts consultation only', async () => {
        const postConsultation = jest.fn().mockResolvedValue({ consultation_id: 456 });
        const postPrescription = jest.fn();

        const result = await runRecetaSubmitFlow({
            recetaText: '   ',
            parseReceta: parseRecetaToMedications,
            postConsultation,
            postPrescription
        });

        expect(result).toEqual({ ok: true });
        expect(postConsultation).toHaveBeenCalledTimes(1);
        expect(postPrescription).not.toHaveBeenCalled();
    });
});
