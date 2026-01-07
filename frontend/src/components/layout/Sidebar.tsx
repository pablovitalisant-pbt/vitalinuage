
import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, Settings, X, Menu } from 'lucide-react';

export interface NavItem {
    label: string;
    path: string;
    icon: ReactNode;
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const navItems = [
    { label: 'Inicio', path: '/dashboard', icon: <Home size={20} /> },
    { label: 'Pacientes', path: '/patients', icon: <Users size={20} /> },
    { label: 'Citas', path: '/appointments', icon: <Calendar size={20} /> },
    { label: 'Configuración', path: '/settings', icon: <Settings size={20} /> },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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
                w-64 bg-white border-r border-slate-200 shadow-sm
                transform transition-transform duration-200 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                    <span className="text-xl font-bold text-slate-800">Vitalinuage</span>
                    <button onClick={onClose} className="md:hidden text-slate-500">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => window.innerWidth < 768 && onClose()}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                ${isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}
