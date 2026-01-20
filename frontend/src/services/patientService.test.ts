/**
 * @jest-environment jsdom
 */
import { patientService } from './patientService';

describe('patientService', () => {
    it('getAll calls the injected fetcher with correct URL', async () => {
        const mockFetcher = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => []
        });

        await patientService.getAll(mockFetcher);

        expect(mockFetcher).toHaveBeenCalledWith(
            expect.stringContaining('/api/patients'), // Expecting standard endpoint
            expect.anything()
        );
    });

    it('search calls the injected fetcher with query params', async () => {
        const mockFetcher = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => []
        });

        await patientService.search(mockFetcher, 'doe');

        expect(mockFetcher).toHaveBeenCalledWith(
            expect.stringContaining('/api/patients/search?q=doe'),
            expect.anything()
        );
    });
});
