import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface VerificationData {
    valid: boolean;
    doctor_name: string;
    issue_date: string;
    verification_message: string;
    scanned_count: number;
}

const PublicValidation = () => {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<VerificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (token) {
            // Call QR verification endpoint
            fetch(`/v/${token}`)
                .then((res) => {
                    if (res.ok) {
                        return res.json();
                    }
                    throw new Error('Invalid verification');
                })
                .then((result) => {
                    setData(result);
                })
                .catch(() => setError(true))
                .finally(() => setLoading(false));
        } else {
            setError(true);
            setLoading(false);
        }
    }, [token]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
                <p style={{ color: '#6b7280', fontFamily: 'sans-serif' }}>Verificando receta...</p>
            </div>
        );
    }

    if (error || !data || !data.valid) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fef2f2', fontFamily: 'sans-serif' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
                <h2 style={{ color: '#dc2626', fontSize: '24px', fontWeight: 'bold' }}>Receta No Válida</h2>
                <p style={{ color: '#7f1d1d', marginTop: '10px' }}>No pudimos verificar esta receta.</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>

                <div style={{ width: '80px', height: '80px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <span style={{ fontSize: '40px', color: '#16a34a' }}>✓</span>
                </div>

                <h1 style={{ color: '#166534', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Receta Verificada</h1>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '30px' }}>{data.verification_message}</p>

                <div style={{ textAlign: 'left', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Médico Emisor</p>
                        <p style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>{data.doctor_name}</p>
                    </div>

                    <div>
                        <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Fecha de Emisión</p>
                        <p style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>{data.issue_date}</p>
                    </div>
                </div>

                <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                        Esta receta fue emitida por un médico verificado en Vitalinuage.
                    </p>
                    <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '10px' }}>
                        Verificaciones: {data.scanned_count}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicValidation;
