import React, { useState } from 'react';
import { DeliveryService } from '../services/delivery.service';
import { useAuthFetch } from '../hooks/useAuthFetch';

interface PrescriptionDeliveryProps {
    consultationId: string;
    patientEmail?: string;
}

const PrescriptionDelivery: React.FC<PrescriptionDeliveryProps> = ({ consultationId, patientEmail }) => {
    const authFetch = useAuthFetch();
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState('');
    const [emailError, setEmailError] = useState('');

    const handleWhatsApp = async () => {
        try {
            const url = await DeliveryService.getWhatsAppLink(authFetch, consultationId);
            window.open(url, '_blank');
        } catch (err) {
            alert('Error al generar enlace de WhatsApp');
        }
    };

    const handleEmail = async () => {
        if (!patientEmail) {
            alert('No hay email registrado para este paciente');
            return;
        }

        setEmailLoading(true);
        setEmailSuccess('');
        setEmailError('');

        try {
            await DeliveryService.sendEmail(authFetch, consultationId, patientEmail);
            setEmailSuccess(`Enviado a ${patientEmail}`);
        } catch (err: any) {
            setEmailError(err.message || 'Error al enviar email');
        } finally {
            setEmailLoading(false);
        }
    };

    return (
        <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Entrega Multicanal</h3>

            <div className="flex gap-4">
                {/* WhatsApp Button */}
                <button
                    onClick={handleWhatsApp}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded shadow flex items-center justify-center gap-2 transition-colors"
                >
                    <span>📱</span> Enviar por WhatsApp
                </button>

                {/* Email Button */}
                <button
                    onClick={handleEmail}
                    disabled={emailLoading}
                    className={`flex-1 font-medium py-2 px-4 rounded shadow flex items-center justify-center gap-2 transition-colors
            ${emailLoading
                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                    {emailLoading ? 'Enviando...' : (
                        <>
                            <span>✉️</span> Enviar por Email
                        </>
                    )}
                </button>
            </div>

            {/* Feedback Messages */}
            {emailSuccess && (
                <p className="mt-2 text-sm text-green-600 font-medium text-center">
                    ✅ {emailSuccess}
                </p>
            )}

            {emailError && (
                <p className="mt-2 text-sm text-red-600 font-medium text-center">
                    ❌ {emailError}
                </p>
            )}

            {/* Delivery History Log Placeholder */}
            <div className="mt-4 bg-gray-50 p-3 rounded text-xs text-gray-500">
                <p className="font-semibold mb-1">Historial de Envíos:</p>
                <p>• {emailSuccess ? 'Email enviado recientemente' : 'No hay envíos recientes'}</p>
                {/* Future: Fetch logs from API */}
            </div>
        </div>
    );
};

export default PrescriptionDelivery;
