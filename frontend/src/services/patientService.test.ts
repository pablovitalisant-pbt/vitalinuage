/**
 * @jest-environment jsdom
 */
import { patientService } from './patientService';

// Mock fetch
global.fetch = jest.fn();

describe('patientService', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    it('getAll injects Authorization header with token', async () => {
        const token = "test-token-123";
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        await patientService.getAll(token);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/pacientes'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': `Bearer ${token}`
                })
            })
        );
    });
});
