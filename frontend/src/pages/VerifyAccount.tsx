import React from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyAccount: React.FC = () => {
    const navigate = useNavigate();

    // Legacy Page Handler
    // Since verification is now handled explicitly by Firebase Link handlers or direct Login check.
    // This page serves as a fallback instructions page.

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f8f9fa',
            fontFamily: "'Inter', sans-serif"
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

                <h2 style={{ color: '#2d3748', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700' }}>Verificación requerida</h2>
                <p style={{ color: '#4a5568', marginBottom: '1.5rem' }}>
                    Hemos enviado un enlace de verificación a tu correo. Por favor, haz clic en ese enlace para activar tu cuenta.
                </p>
                <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Una vez verificado, puedes iniciar sesión.
                </p>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        backgroundColor: '#2c5282',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    Ir al Login
                </button>
            </div>
        </div>
    );
};

export default VerifyAccount;
