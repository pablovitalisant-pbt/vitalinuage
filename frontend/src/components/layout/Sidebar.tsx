
import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
    { label: 'Pacientes', path: '/patients', icon: <Users size={20} /> },
    { label: 'Citas', path: '/appointments', icon: <Calendar size={20} /> },
    // Removed Configuración as per Slice 13 Contract
];

export default function Sidebar({ isOpen, onClose, isCollapsed = false, toggleCollapse }: SidebarProps) {
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
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'w-20' : 'w-64'}
            `}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 relative">
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

                {/* Toggle Button (Desktop Only) */}
                <button
                    onClick={toggleCollapse}
                    aria-label="toggle sidebar"
                    className="hidden md:flex absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 shadow-sm text-slate-500 hover:text-slate-800 z-50"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <nav className="p-3 space-y-1">
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
            </aside>
        </>
    );
}
