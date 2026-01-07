
import React from 'react';
import OnboardingForm from '../components/onboarding/OnboardingForm';

export default function OnboardingPage() {
    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1>Bienvenido a Vitalinuage</h1>
            <p>Por favor, completa tu perfil profesional para continuar.</p>
            <div style={{ marginTop: '2rem', width: '100%', maxWidth: '400px' }}>
                <OnboardingForm />
            </div>
        </div>
    );
}
