import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    console.log("Token recibido:", token);
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token de verificación no encontrado.');
            return;
        }

        const verifyToken = async () => {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${baseUrl}/auth/verify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Error en la verificación' }));
                    throw new Error(errorData.detail || 'Token inválido o expirado.');
                }

                // Success
                setStatus('success');

                // Redirect after 3 seconds
                setTimeout(() => {
                    navigate('/');
                }, 3000);

            } catch (err) {
                setStatus('error');
                setMessage(err instanceof Error ? err.message : 'Error desconocido.');
            }
        };

        verifyToken();
    }, [token, navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f8f9fa',
            fontFamily: "'Inter', sans-serif" // Assuming Inter or similar is available
        }}>
            <div style={{
                padding: '2.5rem',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                width: '100%',
                maxWidth: '450px',
                textAlign: 'center'
            }}>
                <h1 style={{ color: '#1a365d', marginBottom: '1.5rem', fontSize: '2rem', fontWeight: '800' }}>Vitalinuage</h1>

                {status === 'verifying' && (
                    <div>
                        <div style={{
                            border: '4px solid #f3f3f3',
                            borderRadius: '50%',
                            borderTop: '4px solid #2c5282',
                            width: '40px',
                            height: '40px',
                            margin: '0 auto 1.5rem',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p style={{ color: '#4a5568', fontSize: '1.1rem' }}>Verificando tu cuenta...</p>
                        <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                    </div>
                )}

                {status === 'success' && (
                    <div>
                        <div style={{
                            color: '#38a169',
                            fontSize: '3rem',
                            marginBottom: '1rem'
                        }}>✓</div>
                        <h2 style={{ color: '#2d3748', fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>¡Cuenta verificada!</h2>
                        <p style={{ color: '#718096' }}>Redirigiendo al login...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <div style={{
                            color: '#e53e3e',
                            fontSize: '3rem',
                            marginBottom: '1rem'
                        }}>✕</div>
                        <h2 style={{ color: '#2d3748', fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>Error de verificación</h2>
                        <p style={{ color: '#e53e3e', marginBottom: '1.5rem' }}>{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                backgroundColor: '#2c5282',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '6px',
                                border: 'none',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
