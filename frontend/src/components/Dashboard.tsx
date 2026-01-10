import { usePatients } from '../hooks/usePatients';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { patients, loading, isEmpty } = usePatients();
    const navigate = useNavigate();

    if (loading) {
        return <div className="p-8 text-center">Cargando pacientes...</div>;
    }

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes pacientes asignados</h3>
                <p className="text-gray-500 mb-6 text-center">Registra tu primer paciente para comenzar a gestionar sus consultas.</p>
                <button
                    onClick={() => navigate('/register')}
                    className="bg-[#1e3a8a] text-white px-4 py-2 rounded-md hover:bg-blue-900 transition-colors"
                >
                    Registrar Nuevo Paciente
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-[#1e3a8a] mb-4">Mis Pacientes ({patients.length})</h2>
            <ul className="divide-y divide-gray-100">
                {patients.map((patient: any) => (
                    <li key={patient.id} className="py-4 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/patient/${patient.id}`, { state: { from: '/dashboard' } })}>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{patient.nombre} {patient.apellido_paterno}</span>
                            <span className="text-sm text-gray-500">DNI: {patient.dni}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
