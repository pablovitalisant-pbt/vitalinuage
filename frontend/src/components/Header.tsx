import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useDoctor } from '../context/DoctorContext';

export default function Header() {
    const navigate = useNavigate();
    const { profile } = useDoctor();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = () => {
        // In a real app, clear tokens here
        navigate('/');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 flex items-center justify-between px-6 transition-all">
            {/* Logo Area - Clickable to go home */}
            <div
                onClick={() => navigate('/search')}
                className="text-xl font-bold text-[#1e3a8a] cursor-pointer tracking-tight"
            >
                Vitalinuage
            </div>

            {/* User Area */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors outline-none focus:ring-2 focus:ring-blue-100"
                >
                    <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-[#1e3a8a]">
                        <User className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">{profile.professionalName}</span>
                    <ChevronDown className={twMerge("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "transform rotate-180")} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        <div className="px-4 py-2 border-b border-gray-50">
                            <p className="text-sm font-medium text-slate-900">{profile.professionalName}</p>
                            <p className="text-xs text-slate-500 truncate">doctor@vitalinuage.com</p>
                        </div>

                        <div className="py-1">
                            <button
                                onClick={() => { setIsOpen(false); navigate('/settings'); }}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <Settings className="h-4 w-4 text-slate-400" />
                                Configuración de Perfil
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="h-4 w-4 text-red-400" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
