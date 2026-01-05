import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? '/register' : '/login';

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
        const errorMessage = typeof errorData.detail === 'string'
          ? errorData.detail
          : 'Credenciales o datos incorrectos';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!isRegister) {
        localStorage.setItem('token', data.access_token);
        console.log('[LOGIN] Token saved, redirecting to dashboard...');
        navigate('/dashboard');
      } else {
        alert('Cuenta creada. Ahora puedes ingresar.');
        setIsRegister(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión o datos inválidos');
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
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="nombre@vitalinuage.com" required />
          </div>
          <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="********" required />
          </div>
          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2c5282', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isRegister ? 'Crear Cuenta' : 'Ingresar'}
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
