import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { DoctorProvider, DoctorContext } from '../context/DoctorContext';
import * as apiConfig from '../config/api';

// Mock getApiUrl
jest.mock('../config/api', () => ({
    getApiUrl: jest.fn((path) => `http://localhost:8000${path}`)
}));

// Mock feature flags
jest.mock('../../../config/feature-flags.json', () => ({
    identity_search_v1: true
}));

const TestComponent = () => {
    const context = React.useContext(DoctorContext);
    if (!context) return null;
    return (
        <div>
            <div data-testid="loading-state">{context.isLoading ? 'Loading...' : 'Loaded'}</div>
            <div data-testid="auth-status">{context.authStatusMessage || 'No status'}</div>
            <div data-testid="profile-name">{context.profile.professionalName}</div>
        </div>
    );
};

describe('Slice 23: Login Deadlock & Latency Tests', () => {
    // Helper to mock fetch with specific delay and response
    const mockFetchWithDelay = (delayMs: number, response: any = { ok: true, json: async () => ({}) }) => {
        return jest.fn().mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve(response), delayMs))
        );
    };

    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('token', 'fake-token');
    });

    afterEach(() => {
        global.fetch = originalFetch;
        localStorage.clear();
    });

    it('RED TEST: should recover from infinite loading (Deadlock) on network error', async () => {
        // Simulate immediate network error
        global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));

        await act(async () => {
            render(
                <DoctorProvider>
                    <TestComponent />
                </DoctorProvider>
            );
        });

        // Current implementation might stay loading if error not handled correctly in all paths
        // We expect it to eventually NOT be loading
        await waitFor(() => {
            expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
        });
    });

    it('RED TEST: should handle 401 Unauthorized by clearing state and stopping loading', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: async () => ({ detail: 'Unauthorized' })
        });

        await act(async () => {
            render(
                <DoctorProvider>
                    <TestComponent />
                </DoctorProvider>
            );
        });

        await waitFor(() => {
            expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
            expect(screen.getByTestId('profile-name')).toHaveTextContent('Dr. Vitali'); // Default
        });
    });

    it('RED TEST: should trigger AbortController timeout on extreme latency (15s)', async () => {
        // Mock fetch to simulate 15s delay (longer than 12s timeout)
        global.fetch = jest.fn().mockImplementation((url, options) =>
            new Promise((resolve, reject) => {
                const signal = options?.signal;

                const timer = setTimeout(() => {
                    resolve({ ok: true, json: async () => ({ professionalName: "Dr. Slow" }) });
                }, 15000); // 15s delay

                if (signal) {
                    if (signal.aborted) {
                        clearTimeout(timer);
                        const err = new Error('The operation was aborted');
                        err.name = 'AbortError';
                        reject(err);
                    } else {
                        signal.addEventListener('abort', () => {
                            clearTimeout(timer);
                            const err = new Error('The operation was aborted');
                            err.name = 'AbortError';
                            reject(err);
                        });
                    }
                }
            })
        );

        await act(async () => {
            render(
                <DoctorProvider>
                    <TestComponent />
                </DoctorProvider>
            );
        });

        // 1. Should show "Despertando servidor..." after 7s (approx check)
        // We use fake timers or just wait. For robustness in this red test, we check if logic exists.
        // But since we can't easily wait 7s in a unit test without fake timers,
        // we will check if the mechanism is ensuring exit before 15s.

        // Wait for Loading to finish BEFORE 15s.
        // If it waits 15s, this test will be slow or fail if we set a lower timeout on the expectation.

        await waitFor(() => {
            expect(screen.getByTestId('loading-state')).toHaveTextContent('Loaded');
        }, { timeout: 14000 }); // Increase waitFor timeout too
    }, 20000); // Pass timeout as 3rd arg

    it('RED TEST: should show "Despertando servidor..." message after 7 seconds of latency', async () => {
        jest.useFakeTimers();
        global.fetch = jest.fn().mockImplementation(() => new Promise(() => { })); // Never resolves

        render(
            <DoctorProvider>
                <TestComponent />
            </DoctorProvider>
        );

        // Advance time by 7.5 seconds
        act(() => {
            jest.advanceTimersByTime(7500);
        });

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Despertando servidor...');
        });

        jest.useRealTimers();
    });
});
