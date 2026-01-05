/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DoctorProvider, useDoctor } from './DoctorContext';
import React from 'react';

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
    })
) as jest.Mock;

// Setup Mock Component to consume context
const TestConsumer = () => {
    const { token, setToken } = useDoctor();
    return (
        <div>
            <span data-testid="token-value">{token || "NO_TOKEN"}</span>
            <button onClick={() => setToken("new-token")}>Set Token</button>
        </div>
    );
};

describe('DoctorContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('provides token reactively after setToken', async () => {
        render(
            <DoctorProvider>
                <TestConsumer />
            </DoctorProvider>
        );

        expect(screen.getByTestId('token-value')).toHaveTextContent("NO_TOKEN");

        fireEvent.click(screen.getByText('Set Token'));

        await waitFor(() => expect(screen.getByTestId('token-value')).toHaveTextContent("new-token"));
    });
});
