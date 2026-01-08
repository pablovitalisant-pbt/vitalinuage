import { useEffect, useState } from 'react';
import { Calendar, Stethoscope, FileText, MessageCircle, Mail } from 'lucide-react';
import { ClinicalConsultation } from '../contracts/consultations';
import { isMobileDevice } from '../utils/device';
import toast from 'react-hot-toast';
import apiConfig from '../config/api';
import { getApiUrl } from '../config/api';

interface Props {
    patientId: number;
}

export default function ConsultationManager({ patientId }: Props) {
    const [history, setHistory] = useState<ClinicalConsultation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [patientId]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/api/patients/${patientId}/consultations`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error("Failed to load consultations", err);
        } finally {
            setLoading(false);
        }
    };



    const handleDownloadPDF = (consultationId: number) => {
        const token = localStorage.getItem('token');
        const apiUrl = apiConfig.apiBaseUrl;
        const pdfUrl = `${apiUrl}/api/consultas/${consultationId}/pdf`;

        // Open PDF in new tab with authorization
        window.open(pdfUrl, '_blank');
    };

    const handleSendWhatsApp = async (consultation: ClinicalConsultation) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = apiConfig.apiBaseUrl;

            // 1. Get or create verification UUID
            const verificationRes = await fetch(`${apiUrl}/api/consultas/${consultation.id}/create-verification`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!verificationRes.ok) {
                toast.error('Error al generar el enlace de verificaciÃ³n');
                return;
            }

            const { uuid } = await verificationRes.json();

            // 2. Build public PDF URL
            const pdfUrl = `${apiUrl}/v/${uuid}/pdf`;

            // 3. Get patient data
            const patientName = `${consultation.patient.nombre} ${consultation.patient.apellido_paterno}`;
            const doctorName = "Dr. Vitalinuage"; // TODO: Get from context

            // 4. Build message
            const message = `Hola ${patientName}, el ${doctorName} le envÃ­a su receta mÃ©dica de Vitalinuage. Puede verla aquÃ­: ${pdfUrl}`;

            // 5. Clean phone number (only digits)
            const phone = consultation.patient.telefono?.replace(/\D/g, '');

            if (!phone) {
                toast.error('El paciente no tiene telÃ©fono registrado');
                return;
            }

            // 6. Encode message
            const encodedMessage = encodeURIComponent(message);

            // 7. Detect device and build URL
            const isMobile = isMobileDevice();
            const whatsappUrl = isMobile
                ? `https://wa.me/${phone}?text=${encodedMessage}`
                : `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;

            // 8. Show toast for desktop users
            if (!isMobile) {
                toast('AsegÃºrate de tener WhatsApp Web abierto en otra pestaÃ±a', {
                    duration: 3000,
                    icon: 'â„¹ï¸',
                });

                // Wait 1.5 seconds before opening
                setTimeout(() => {
                    window.open(whatsappUrl, '_blank');

                    // Tracking
                    fetch(`${apiUrl}/api/consultas/${consultation.id}/mark-whatsapp-sent`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(console.error);

                    setHistory(prev => prev.map(item =>
                        item.id === consultation.id
                            ? { ...item, whatsapp_sent_at: new Date().toISOString() }
                            : item
                    ));
                }, 1500);
            } else {
                // Mobile: open immediately
                window.open(whatsappUrl, '_blank');

                // Tracking
                fetch(`${apiUrl}/api/consultas/${consultation.id}/mark-whatsapp-sent`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(console.error);

                setHistory(prev => prev.map(item =>
                    item.id === consultation.id
                        ? { ...item, whatsapp_sent_at: new Date().toISOString() }
                        : item
                ));
            }
        } catch (err) {
            console.error('Error sending WhatsApp:', err);
            toast.error('Error al enviar por WhatsApp');
        }
    };

    const handleSendEmail = async (consultation: ClinicalConsultation) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = apiConfig.apiBaseUrl;

            // Validar email
            if (!consultation.patient?.email) {
                toast.error('El paciente no tiene email registrado');
                return;
            }

            // Enviar email
            const response = await fetch(
                `${apiUrl}/api/consultas/${consultation.id}/send-email`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                toast.success(`Email enviado a ${consultation.patient.email}`);
                setHistory(prev => prev.map(item =>
                    item.id === consultation.id
                        ? { ...item, email_sent_at: new Date().toISOString() }
                        : item
                ));
            } else {
                const error = await response.json();
                toast.error(error.detail || 'Error al enviar email');
            }
        } catch (err) {
            console.error('Error sending email:', err);
            toast.error('Error al enviar email');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Cargando historial...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Stethoscope className="text-[#1e3a8a] w-5 h-5" />
                    <h2 className="text-lg font-semibold text-[#1e3a8a]">Evolución Clínica</h2>
                </div>
            </div>

            <div className="space-y-4">
                {history.length === 0 ? (
                    <div className="py-12 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-400">
                        <Stethoscope className="w-12 h-12 mb-3 opacity-20" />
                        <p>No hay consultas registradas.</p>
                    </div>
                ) : (
                    history.map(c => (
                        <div key={c.id} className="group border border-slate-100 rounded-lg p-5 hover:shadow-md transition-all bg-white relative">
                            <div className="absolute top-5 right-5 flex items-center gap-3">
                                <button
                                    onClick={() => handleSendWhatsApp(c)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium shadow-sm"
                                    title="Enviar por WhatsApp"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    WhatsApp
                                </button>
                                <button
                                    onClick={() => handleSendEmail(c)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-medium shadow-sm"
                                    title="Enviar por Email"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    Email
                                </button>
                                <button
                                    onClick={() => handleDownloadPDF(c.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium shadow-sm"
                                    title="Descargar Receta PDF"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Receta PDF
                                </button>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Fecha desc.'}
                                </div>
                            </div>

                            <h3 className="text-md font-semibold text-[#1e3a8a] mb-1">{c.motivo_consulta}</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                DX: {c.diagnostico}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                    <p className="font-semibold text-xs text-slate-400 mb-1">TRATAMIENTO</p>
                                    {c.plan_tratamiento}
                                </div>
                                {c.examen_fisico && (
                                    <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                        <p className="font-semibold text-xs text-slate-400 mb-1">EXAMEN FÃSICO</p>
                                        {c.examen_fisico}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}


