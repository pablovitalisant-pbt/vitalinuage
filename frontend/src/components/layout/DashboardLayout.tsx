
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from '../Header';
import { Menu } from 'lucide-react';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header Toggle */}
                <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="ml-4 font-semibold text-slate-800">Menu</span>
                </div>

                {/* Main Header (Desktop hidden if we want specific layout, but users requested Header Sync) */}
                {/* Actually, user requested "Header should extract professional_name". The existing Header handles this internally via DoctorContext logic.
                    We just render it here. */}
                <div className="hidden md:block">
                    <Header />
                </div>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
