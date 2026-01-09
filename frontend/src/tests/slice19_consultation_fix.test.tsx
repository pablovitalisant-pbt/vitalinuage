/**
 * Slice 19: NewConsultation.tsx - Red Tests
 * 
 * These tests verify that NewConsultation.tsx:
 * 1. Uses correct endpoint: /api/patients/{id}/consultations
 * 2. Includes Authorization headers in fetch calls
 * 3. Uses getApiUrl helper function
 * 4. Destructures token from useDoctor hook
 * 
 * EXPECTED: All tests should FAIL (Red) before implementation
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Slice 19: NewConsultation.tsx - Endpoint and Auth Verification', () => {
    const newConsultationPath = path.join(__dirname, '..', 'pages', 'NewConsultation.tsx');
    const NewConsultationSource = fs.readFileSync(newConsultationPath, 'utf-8');

    it('RED TEST: should use correct endpoint /api/patients/:id/consultations', () => {
        const hasCorrectEndpoint = NewConsultationSource.includes('/api/patients/') &&
            NewConsultationSource.includes('/consultations');
        const hasIncorrectEndpoint = NewConsultationSource.includes('/api/consultations') &&
            !NewConsultationSource.includes('/api/patients/');

        // This will FAIL because current code uses /api/consultations
        expect(hasIncorrectEndpoint).toBe(false);
        expect(hasCorrectEndpoint).toBe(true);
    });

    it('RED TEST: should include Authorization header in fetch call', () => {
        // Check if Authorization header is used in the handleSubmit function
        const handleSubmitBlock = NewConsultationSource.substring(
            NewConsultationSource.indexOf('const handleSubmit'),
            NewConsultationSource.indexOf('navigate(`/patient/')
        );

        const hasAuthHeader = handleSubmitBlock.includes('Authorization') &&
            handleSubmitBlock.includes('Bearer');

        // This will FAIL because current code doesn't include auth headers
        expect(hasAuthHeader).toBe(true);
    });

    it('RED TEST: should use getApiUrl helper for endpoint', () => {
        const hasGetApiUrlImport = NewConsultationSource.includes("import { getApiUrl }");
        const usesGetApiUrl = NewConsultationSource.includes('getApiUrl(');

        // This will FAIL because current code doesn't use getApiUrl
        expect(hasGetApiUrlImport).toBe(true);
        expect(usesGetApiUrl).toBe(true);
    });

    it('RED TEST: should destructure token from useDoctor hook', () => {
        const useDoctorLine = NewConsultationSource.split('\n').find((line: string) =>
            line.includes('const { profile') && line.includes('useDoctor')
        );

        expect(useDoctorLine).toBeDefined();

        // Should destructure both profile AND token
        const destructuresToken = useDoctorLine?.includes('token');

        // This will FAIL because current code only destructures profile
        expect(destructuresToken).toBe(true);
    });

    it('RED TEST: should send consultation data with correct schema', () => {
        // Verify the payload includes reason, diagnosis, treatment (not patient_id, doctor_name, etc.)
        const payloadBlock = NewConsultationSource.substring(
            NewConsultationSource.indexOf('const payload = {'),
            NewConsultationSource.indexOf('const res = await fetch')
        );

        const hasCorrectSchema = payloadBlock.includes('reason:') &&
            payloadBlock.includes('diagnosis:') &&
            payloadBlock.includes('treatment:');

        const hasIncorrectFields = payloadBlock.includes('patient_id:') ||
            payloadBlock.includes('doctor_name:');

        // This will FAIL because current code sends patient_id and doctor_name
        expect(hasIncorrectFields).toBe(false);
        expect(hasCorrectSchema).toBe(true);
    });
});

describe('Slice 19: ConsultationManager.tsx - Encoding and Cleanup Verification', () => {
    const consultationManagerPath = path.join(__dirname, '..', 'components', 'ConsultationManager.tsx');
    const ConsultationManagerSource = fs.readFileSync(consultationManagerPath, 'utf-8');

    it('RED TEST: should have correct UTF-8 encoding for "Evolución Clínica"', () => {
        const hasCorrectEncoding = ConsultationManagerSource.includes('Evolución Clínica');
        const hasBadEncoding = ConsultationManagerSource.includes('Evolución ClÃ­nica') ||
            ConsultationManagerSource.includes('EvoluciÃ³n ClÃ­nica');

        // This will FAIL because current code has encoding issues
        expect(hasBadEncoding).toBe(false);
        expect(hasCorrectEncoding).toBe(true);
    });

    it('RED TEST: should NOT have inline form (should be removed)', () => {
        // Check if the inline form creation UI exists
        const hasInlineForm = ConsultationManagerSource.includes('isCreating') &&
            ConsultationManagerSource.includes('<form onSubmit={handleSubmit}');

        // This will FAIL because inline form still exists
        expect(hasInlineForm).toBe(false);
    });

    it('RED TEST: should NOT have "Nueva Consulta" button', () => {
        // Check if the "Nueva Consulta" button exists in ConsultationManager
        const hasNewConsultationButton = ConsultationManagerSource.includes('Nueva Consulta') &&
            ConsultationManagerSource.includes('setIsCreating(true)');

        // This will FAIL because button still exists
        expect(hasNewConsultationButton).toBe(false);
    });
});
