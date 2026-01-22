import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useDoctor } from '../context/DoctorContext';
import { getBlob, ref } from 'firebase/storage';
import { storage } from '../firebase';

export default function Header() {
    const navigate = useNavigate();
    const { profile, logout } = useDoctor();
    const [isOpen, setIsOpen] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
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

    useEffect(() => {
        let isActive = true;
        let objectUrl: string | null = null;

        const normalizeStoragePath = (storedValue: string) => {
            if (!storedValue.startsWith('http')) return storedValue;
            try {
                const parsedUrl = new URL(storedValue);
                if (parsedUrl.hostname.includes('firebasestorage.googleapis.com')) {
                    const pathMatch = parsedUrl.pathname.match(/\/o\/(.+)$/);
                    if (pathMatch?.[1]) {
                        return decodeURIComponent(pathMatch[1]);
                    }
                }
                if (parsedUrl.hostname.includes('storage.googleapis.com')) {
                    const trimmed = parsedUrl.pathname.replace(/^\//, '');
                    const [, ...rest] = trimmed.split('/');
                    if (rest.length) {
                        return rest.join('/');
                    }
                }
            } catch (error) {
                console.warn('Error parsing storage URL', error);
            }
            return storedValue;
        };

        const loadProfileImage = async () => {
            if (!profile?.profileImage) {
                setProfileImageUrl(null);
                return;
            }

            const resolvedPath = normalizeStoragePath(profile.profileImage);
            try {
                if (!resolvedPath.startsWith('http')) {
                    const storageRef = ref(storage, resolvedPath);
                    const blob = await getBlob(storageRef);
                    objectUrl = URL.createObjectURL(blob);
                    if (isActive) {
                        setProfileImageUrl(objectUrl);
                    }
                    return;
                }
                if (isActive) {
                    setProfileImageUrl(resolvedPath);
                }
            } catch (error) {
                console.error('Error loading header profile image', error);
                if (isActive) {
                    setProfileImageUrl(null);
                }
            }
        };

        loadProfileImage();

        return () => {
            isActive = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [profile?.profileImage]);

    const handleLogout = async () => {
        console.log('[AUTH AUDIT] Header Logout CLICK handler fired');
        try {
            await logout();
        } catch (error) {
            console.error('[AUTH AUDIT] Header logout failed', error);
        }
    };

    return (
        <header className="sticky top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 flex items-center justify-between px-6 transition-all">
            {/* Date Display (moved from Dashboard) */}
            <div
                data-testid="header-date-display"
                className="hidden md:block text-sm font-medium text-slate-500"
            >
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    .replace(/^\w/, c => c.toUpperCase())}
            </div>

            {/* User Area */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors outline-none focus:ring-2 focus:ring-blue-100"
                >
                    <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-[#1e3a8a] overflow-hidden">
                        {profileImageUrl ? (
                            <img
                                src={profileImageUrl}
                                alt="Foto de perfil"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <User className="h-5 w-5" />
                        )}
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">{profile.professionalName}</span>
                    <ChevronDown className={twMerge("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "transform rotate-180")} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        <div className="px-4 py-2 border-b border-gray-50">
                            <p className="text-sm font-medium text-slate-900">{profile.professionalName}</p>
                            <p className="text-xs text-slate-500 truncate">{profile.email || "Usuario"}</p>
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
