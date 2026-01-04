import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DeliveryService } from '../services/delivery.service';

const PublicValidation = () => {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (token) {
            DeliveryService.validateToken(token)
                .then((result) => {
                    if (result) {
                        setData(result);
                    } else {
                        setError(true);
                    }
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

    if (error || !data) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fef2f2', fontFamily: 'sans-serif' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
                <h2 style={{ color: '#dc2626', fontSize: '24px', fontWeight: 'bold' }}>Enlace Inválido o Caducado</h2>
                <p style={{ color: '#7f1d1d', marginTop: '10px' }}>No pudimos encontrar la receta solicitada.</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>

                <div style={{ width: '80px', height: '80px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <span style={{ fontSize: '40px', color: '#16a34a' }}>✓</span>
                </div>

                <h1 style={{ color: '#166534', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Receta Válida</h1>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '30px' }}>Emitida por Vitalinuage</p>

                <div style={{ textAlign: 'left', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Médico Tratante</p>
                        <p style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>{data.doctor}</p>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Paciente</p>
                        <p style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>{data.patient}</p>
                    </div>

                    <div>
                        <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Fecha de Emisión</p>
                        <p style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>{data.date}</p>
                    </div>
                </div>

                <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                        Este documento digital cuenta con seguridad criptográfica y es válido para la dispensación de medicamentos.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicValidation;
