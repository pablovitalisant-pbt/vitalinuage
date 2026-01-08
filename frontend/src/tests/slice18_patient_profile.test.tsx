/**
 * Slice 18: PatientProfile.tsx - Red Tests
 * 
 * These tests verify that PatientProfile.tsx uses:
 * 1. Correct endpoint: /api/patients/:id (not /api/pacientes/:id)
 * 2. Authorization headers in fetch calls
 * 3. getApiUrl helper function
 * 4. Token from useDoctor hook
 * 
 * EXPECTED: All tests should FAIL (Red) before implementation
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Slice 18: PatientProfile.tsx - Endpoint and Auth Verification', () => {
    const patientProfilePath = path.join(__dirname, '..', 'pages', 'PatientProfile.tsx');
    const PatientProfileSource = fs.readFileSync(patientProfilePath, 'utf-8');

    it('RED TEST: should use correct English endpoint /api/patients/:id', () => {
        const hasCorrectEndpoint = PatientProfileSource.includes('/api/patients/${id}');
        const hasIncorrectEndpoint = PatientProfileSource.includes('/api/pacientes/${id}');

        // This will FAIL because current code uses /api/pacientes
        expect(hasIncorrectEndpoint).toBe(false);
        expect(hasCorrectEndpoint).toBe(true);
    });

    it('RED TEST: should include Authorization header in patient fetch', () => {
        // Check if Authorization header is used in fetchPatient
        const fetchPatientBlock = PatientProfileSource.substring(
            PatientProfileSource.indexOf('const fetchPatient'),
            PatientProfileSource.indexOf('const fetchConsultations')
        );

        const hasAuthHeader = fetchPatientBlock.includes('Authorization') &&
            fetchPatientBlock.includes('Bearer');

        // This will FAIL because current code doesn't include auth headers
        expect(hasAuthHeader).toBe(true);
    });

    it('RED TEST: should use getApiUrl helper for patient endpoint', () => {
        const hasGetApiUrlImport = PatientProfileSource.includes("import { getApiUrl }");
        const usesGetApiUrlForPatient = PatientProfileSource.includes('getApiUrl(`/api/patients/${id}`)');

        // This will FAIL because current code doesn't use getApiUrl
        expect(hasGetApiUrlImport).toBe(true);
        expect(usesGetApiUrlForPatient).toBe(true);
    });

    it('RED TEST: should destructure token from useDoctor hook', () => {
        const useDoctorLine = PatientProfileSource.split('\n').find((line: string) =>
            line.includes('const { profile') && line.includes('useDoctor')
        );

        expect(useDoctorLine).toBeDefined();

        // Should destructure both profile AND token
        const destructuresToken = useDoctorLine?.includes('token');

        // This will FAIL because current code only destructures profile
        expect(destructuresToken).toBe(true);
    });

    it('RED TEST: consultations fetch should also include Authorization header', () => {
        const fetchConsultationsBlock = PatientProfileSource.substring(
            PatientProfileSource.indexOf('const fetchConsultations'),
            PatientProfileSource.indexOf('Promise.all')
        );

        const hasAuthHeader = fetchConsultationsBlock.includes('Authorization') &&
            fetchConsultationsBlock.includes('Bearer');

        // This will FAIL because consultations fetch also lacks auth
        expect(hasAuthHeader).toBe(true);
    });
});
