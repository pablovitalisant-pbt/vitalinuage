
import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, X, ChevronLeft, ChevronRight, LogOut, BarChart2 } from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext';
import { useNavigate } from 'react-router-dom';

export interface NavItem {
    label: string;
    path: string;
    icon: ReactNode;
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    // Slice 13: Collapse Props
    isCollapsed?: boolean;
    toggleCollapse?: () => void;
}

export const navItems = [
    { label: 'Inicio', path: '/dashboard', icon: <Home size={20} /> },
    { label: 'Panel de Control', path: '/metrics', icon: <BarChart2 size={20} /> },
    { label: 'Pacientes', path: '/patients', icon: <Users size={20} /> },
    { label: 'Citas', path: '/appointments', icon: <Calendar size={20} /> },
    // Removed Configuración as per Slice 13 Contract
];

export default function Sidebar({ isOpen, onClose, isCollapsed = false, toggleCollapse }: SidebarProps) {
    // Slice 40.xx: Fix Logout to use Firebase Context
    // was: const { setToken } = useDoctor();
    const { logout } = useDoctor();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            // Context logout handles navigation, but we ensure it here if needed
            // navigate('/'); // Handled by context or window.location logic
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                bg-white border-r border-slate-200 shadow-sm
                transform transition-all duration-300 ease-in-out
                flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'w-20' : 'w-64'}
            `}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 relative shrink-0">
                    {!isCollapsed && (
                        <span className="text-xl font-bold text-slate-800 animate-in fade-in duration-300">
                            Vitalinuage
                        </span>
                    )}
                    {isCollapsed && (
                        <span className="text-xl font-bold text-slate-800 mx-auto">V</span>
                    )}

                    <button onClick={onClose} className="md:hidden text-slate-500">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => window.innerWidth < 768 && onClose()}
                            className={({ isActive }) => `
                                flex items-center ${isCollapsed ? 'justify-center' : ''} gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                                ${isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                            title={isCollapsed ? item.label : ''}
                        >
                            {// Clone element to force size consistency if needed, but standard size is fine
                                item.icon}
                            {!isCollapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Actions: Logout & Toggle */}
                <div className={`
                    p-3 border-t border-slate-100 shrink-0 flex
                    ${isCollapsed ? 'flex-col gap-2' : 'flex-row justify-between items-center'}
                `}>

                    {/* Logout Button */}
                    {!isCollapsed && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-red-600 hover:bg-red-50"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={20} />
                            <span>Cerrar Sesión</span>
                        </button>
                    )}

                    {/* Toggle Button (Desktop Only) Moved to Footer */}
                    <div className="hidden md:flex">
                        <button
                            onClick={toggleCollapse}
                            aria-label="toggle sidebar"
                            className={`
                                p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors
                                ${isCollapsed ? 'w-full flex justify-center' : ''}
                            `}
                        >
                            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
