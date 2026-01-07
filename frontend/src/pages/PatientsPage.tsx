
import React from 'react';
import PatientTable from '../components/patients/PatientTable';
import { Users } from 'lucide-react';

export default function PatientsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pacientes</h1>
                    <p className="text-slate-500">Gestiona tu cartera de pacientes registrados.</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="text-blue-600" size={24} />
                </div>
            </div>

            <PatientTable />
        </div>
    );
}
