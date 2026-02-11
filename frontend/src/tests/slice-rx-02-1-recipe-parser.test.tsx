import { parseRecetaToMedications } from '../lib/recetaParser';

describe('RX-02-1 parseRecetaToMedications', () => {
    it('parses a single valid line', () => {
        const result = parseRecetaToMedications('Paracetamol | 500 mg | cada 8 horas | 5 días');
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.medications).toHaveLength(1);
            expect(result.medications[0]).toEqual({
                name: 'Paracetamol',
                dosage: '500 mg',
                frequency: 'cada 8 horas',
                duration: '5 días'
            });
        }
    });

    it('parses multiple lines and ignores empty lines', () => {
        const input = [
            'Paracetamol | 500 mg | cada 8 horas | 5 días',
            '',
            'Ibuprofeno | 400 mg | cada 12 horas | 7 días',
            '   '
        ].join('\n');
        const result = parseRecetaToMedications(input);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.medications).toHaveLength(2);
            expect(result.medications[1].name).toBe('Ibuprofeno');
        }
    });

    it('returns error when line does not have exactly 4 parts', () => {
        const result = parseRecetaToMedications('Paracetamol | 500 mg | cada 8 horas');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBe(
                "Cada línea debe tener 4 campos separados por '|': Nombre | Dosis | Frecuencia | Duración"
            );
        }
    });

    it('returns ok with empty medications on empty input', () => {
        const result = parseRecetaToMedications('   ');
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.medications).toEqual([]);
        }
    });
});
