import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoctor } from '../context/DoctorContext';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Slice 40.12: We only need login from context.
  // Updated for Login Redirect logic
  const { login, user, profile, loading } = useDoctor();
  const navigate = useNavigate();

  // [IRON SEAL] Redirect Logic
  // Deterministic redirect to dashboard if user is verified & onboarded.
  // This handles direct access to /login when already authenticated.
  useEffect(() => {
    // 1. Wait for loading to finish
    if (loading) return;
    // 2. Ensure user is authenticated
    if (!user) return;

    // 3. Check business rules: verified AND onboarded
    // Fallback: if profile is not yet loaded, we wait.
    if (profile?.isVerified && profile?.isOnboarded) {
      console.log("[NAVIGATION] Login successful -> redirecting to /dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        // [IRON SEAL] NEW: Direct Firebase Registration
        // 1. Create User in Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // 2. Send Verification Email (Firebase Template)
        await sendEmailVerification(userCredential.user);

        // 3. UX Feedback
        alert('Cuenta creada en Firebase. Por favor, revisa tu correo para verificar tu email antes de entrar.');

        // Backend JIT will handle the rest upon first login with validated token
        setIsRegister(false);
      } else {
        // Login using Firebase directly via Context abstraction
        await login(email, password);
        console.log('[LOGIN] Success. App wrapper should now switch view.');
      }
    } catch (err: any) {
      console.error(err);
      // Map Firebase errors to user friendly messages if possible
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') msg = 'El correo ya está registrado.';
      if (err.code === 'auth/weak-password') msg = 'La contraseña es muy débil.';
      setError(msg || 'Error de conexión o credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '400px', textAlign: 'center' }}>
        <h1 style={{ color: '#1a365d', marginBottom: '0.5rem', fontSize: '2.5rem', fontWeight: '800' }}>Vitalinuage</h1>
        <p style={{ color: '#718096', marginBottom: '1.5rem' }}>{isRegister ? 'Crea tu cuenta médica' : 'Acceso exclusivo para personal médico'}</p>

        {error && <div style={{ backgroundColor: '#fff5f5', color: '#c53030', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', opacity: isLoading ? 0.7 : 1 }}
              placeholder="nombre@vitalinuage.com"
              required
            />
          </div>
          <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', opacity: isLoading ? 0.7 : 1 }}
              placeholder="********"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: isLoading ? '#718096' : '#2c5282', color: '#fff', border: 'none', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' }}
          >
            {isLoading ? 'Procesando...' : (isRegister ? 'Crear Cuenta' : 'Ingresar')}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#4a5568' }}>
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <span onClick={() => setIsRegister(!isRegister)} style={{ color: '#2c5282', cursor: 'pointer', fontWeight: 'bold', marginLeft: '0.5rem' }}>
            {isRegister ? 'Inicia sesión' : 'Regístrate aquí'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
