import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
// @ts-ignore - Component to be created
import ConsultationHistory from './ConsultationHistory';

describe('ConsultationHistory', () => {
    it('renders "No hay consultas registradas" when list is empty', () => {
        // Mock props based on contract
        const emptyProps = {
            consultations: [],
            onSelect: () => { }
        };

        render(<ConsultationHistory {...emptyProps} />);

        expect(screen.getByText(/no hay consultas registradas/i)).toBeInTheDocument();
    });
});
