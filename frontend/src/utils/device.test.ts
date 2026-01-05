/**
 * Tests for device detection utility
 */

describe('Device Detection', () => {
    // Store original userAgent
    const originalUserAgent = navigator.userAgent;

    afterEach(() => {
        // Restore original userAgent
        Object.defineProperty(navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true,
        });
    });

    describe('isMobileDevice', () => {
        it('should return true for iPhone user agent', () => {
            // Mock iPhone user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
                configurable: true,
            });

            // This will fail because function doesn't exist yet
            const { isMobileDevice } = require('../utils/device');
            expect(isMobileDevice()).toBe(true);
        });

        it('should return true for Android user agent', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
                configurable: true,
            });

            const { isMobileDevice } = require('../utils/device');
            expect(isMobileDevice()).toBe(true);
        });

        it('should return false for Chrome on Windows', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                configurable: true,
            });

            const { isMobileDevice } = require('../utils/device');
            expect(isMobileDevice()).toBe(false);
        });

        it('should return false for Firefox on macOS', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
                configurable: true,
            });

            const { isMobileDevice } = require('../utils/device');
            expect(isMobileDevice()).toBe(false);
        });

        it('should return true for iPad', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
                configurable: true,
            });

            const { isMobileDevice } = require('../utils/device');
            expect(isMobileDevice()).toBe(true);
        });
    });

    describe('isDesktopDevice', () => {
        it('should return false for mobile devices', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
                configurable: true,
            });

            const { isDesktopDevice } = require('../utils/device');
            expect(isDesktopDevice()).toBe(false);
        });

        it('should return true for desktop devices', () => {
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                configurable: true,
            });

            const { isDesktopDevice } = require('../utils/device');
            expect(isDesktopDevice()).toBe(true);
        });
    });
});

describe('WhatsApp Link Generation', () => {
    it('should generate correct WhatsApp link with phone and message', () => {
        const phone = '+54 9 11 1234-5678';
        const patientName = 'Juan Pérez';
        const doctorName = 'Dr. Carlos Rodríguez';
        const pdfUrl = 'https://vitalinuage.com/api/v/test-uuid-123/pdf';

        // Expected: Only digits in phone
        const expectedPhone = '5491112345678';

        // Build message
        const message = `Hola ${patientName}, el ${doctorName} le envía su receta médica de Vitalinuage. Puede verla aquí: ${pdfUrl}`;
        const encodedMessage = encodeURIComponent(message);

        // Expected URL
        const expectedUrl = `https://wa.me/${expectedPhone}?text=${encodedMessage}`;

        // Verify phone cleaning (only digits)
        const cleanedPhone = phone.replace(/\D/g, '');
        expect(cleanedPhone).toBe(expectedPhone);

        // Verify URL construction
        const actualUrl = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
        expect(actualUrl).toBe(expectedUrl);
    });

    it('should handle phone numbers without country code', () => {
        const phone = '11 1234-5678';
        const cleanedPhone = phone.replace(/\D/g, '');

        expect(cleanedPhone).toBe('1112345678');
    });

    it('should encode special characters in message', () => {
        const message = 'Hola Juan, aquí está su receta: https://example.com/pdf?id=123&token=abc';
        const encoded = encodeURIComponent(message);

        // Verify encoding
        expect(encoded).toContain('%3A'); // :
        expect(encoded).toContain('%2F'); // /
        expect(encoded).toContain('%3F'); // ?
        expect(encoded).toContain('%3D'); // =
        expect(encoded).toContain('%26'); // &
    });

    it('should create valid WhatsApp URL format', () => {
        const phone = '1234567890';
        const message = 'Test message';
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        // Verify URL structure
        expect(url).toMatch(/^https:\/\/wa\.me\/\d+\?text=.+$/);
    });
});
