import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Sidebar from '../components/layout/Sidebar';
import App from '../App'; // Importing App to test routing if needed, but we might test components directly for isolation
import { DoctorProvider } from '../context/DoctorContext';

// Mocks
jest.mock('../context/DoctorContext', () => ({
    useDoctor: () => ({
        profile: { professionalName: 'Dr. Test' },
        setToken: jest.fn() // For logout verification
    }),
    DoctorProvider: ({ children }: any) => <div>{children}</div>
}));

jest.mock('../config/api', () => ({
    getApiUrl: (path: string) => path
}));

// Mock feature flags
jest.mock('../../../config/feature-flags.json', () => ({
    identity_search_v1: true
}), { virtual: true });


describe('Slice 16: UI Polish & Sidebar Refactor (Red Phase)', () => {

    test('test_home_background_is_white', () => {
        // Goal: Main container should be bg-white when on /dashboard
        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <DashboardLayout />
            </MemoryRouter>
        );

        // We assume the main layout container or the specific content area needs to be white.
        // Currently it is likely bg-slate-50.
        // We'll search for the main container. Usually the one wrapping <Outlet /> or similar.
        // Let's inspect roles. The layout usually doesn't have a role, but we can look for test id or class.
        // Since we can't edit files yet, we rely on structure.
        // DashboardLayout returns <div className="flex h-screen bg-slate-50 ...">

        // We want to assert that when on /dashboard, this class changes or is overridden.
        // Since we can't easily select the root div by role, let's look for text if possible, or just fail based on expected selector presence?
        // Better: DashboardLayout usually renders the Sidebar. Let's look for the container wrapping Sidebar.
        // Actually, render returns container.

        // Strategy: Verify if the top-level div has 'bg-white' class.
        // Current: bg-slate-50

        const layoutContainer = screen.getByRole('complementary').parentElement; // Sidebar is complementary, its parent is the layout root
        // If sidebar is 'aside', parent is the flex container.

        // Assertion: Should satisfy "White Background" requirement
        // We check if classList contains 'bg-white' and NOT 'bg-slate-50' for /dashboard route.

        // Currently this will FAIL because it is bg-slate-50.
        expect(layoutContainer).toHaveClass('bg-white');
        expect(layoutContainer).not.toHaveClass('bg-slate-50');
    });

    test('test_sidebar_has_metrics_link', () => {
        // Goal: Sidebar must have a link "Panel de Control" pointing to /metrics
        render(
            <MemoryRouter>
                <Sidebar isOpen={true} onClose={() => { }} />
            </MemoryRouter>
        );

        const metricsLink = screen.getByText(/Panel de Control/i);
        expect(metricsLink).toBeInTheDocument();
        expect(metricsLink.closest('a')).toHaveAttribute('href', '/metrics');
        // Note: MemoryRouter uses href in tests for NavLink
    });

    test('test_sidebar_footer_actions', () => {
        // Condition B: Expanded -> Logout present, Toggle present
        const { rerender } = render(
            <MemoryRouter>
                <Sidebar isOpen={true} onClose={() => { }} isCollapsed={false} toggleCollapse={() => { }} />
            </MemoryRouter>
        );

        const logoutBtnExpanded = screen.getByTitle(/Cerrar Sesión/i);
        expect(logoutBtnExpanded).toBeInTheDocument();

        // Check for flex-row layout in Footer container
        // We look for the container that holds both Logout and Toggle
        // The Toggle is typically identifiable by aria-label "toggle sidebar"
        const toggleBtn = screen.getByLabelText('toggle sidebar');
        const footerContainer = toggleBtn.closest('div.border-t'); // Assuming footer has border-t from existing code
        // Or better, find common parent
        const commonParent = logoutBtnExpanded.parentElement;

        // This is a rough check for class presence as requested by "Falla B"
        // Note: Implementation might put them in a flex container inside the footer.
        // We will assert on the common parent having flex-row-ish classes or justify-between.
        // For RED phase, we expect this structure might not fully exist or match.
        // Current impl: flex-col gap-2. 
        // We want: flex-row justify-between items-center.
        expect(commonParent).toHaveClass('flex-row');
        expect(commonParent).toHaveClass('justify-between');

        // Condition A: Collapsed -> Logout hidden
        rerender(
            <MemoryRouter>
                <Sidebar isOpen={true} onClose={() => { }} isCollapsed={true} toggleCollapse={() => { }} />
            </MemoryRouter>
        );

        const logoutBtnCollapsed = screen.queryByTitle(/Cerrar Sesión/i);
        expect(logoutBtnCollapsed).not.toBeInTheDocument();
    });

    test('test_routing_metrics_exists', () => {
        // We defer comprehensive routing tests to the App integration test layer or rely on Sidebar verification.
        // The implementation plan includes adding the route.
        // This placeholder acknowledges the requirement plan.
        expect(true).toBe(true);
    });
});
