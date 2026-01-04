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
    const { token, login } = useDoctor();
    return (
        <div>
            <span data-testid="token-value">{token || "NO_TOKEN"}</span>
            <button onClick={() => login("new-token")}>Login</button>
        </div>
    );
};

describe('DoctorContext', () => {
    it('provides token reactively after login', async () => {
        render(
            <DoctorProvider>
                <TestConsumer />
            </DoctorProvider>
        );

        expect(screen.getByTestId('token-value')).toHaveTextContent("NO_TOKEN");

        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => expect(screen.getByTestId('token-value')).toHaveTextContent("new-token"));
    });
});
