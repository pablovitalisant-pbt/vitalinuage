-- VITALINUAGE: Sincronización Total de Esquema (Neon/Postgres)
-- Ejecuta este script en la consola de Neon para corregir todas las tablas.

-- 1. Reparación de la Tabla de Usuarios (Autenticación e Identidad)
DO $$ 
BEGIN 
    -- Columnas de Estado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_onboarded') THEN
        ALTER TABLE users ADD COLUMN is_onboarded BOOLEAN DEFAULT FALSE;
    END IF;

    -- Columnas de Identidad Profesional
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='professional_name') THEN
        ALTER TABLE users ADD COLUMN professional_name VARCHAR;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='specialty') THEN
        ALTER TABLE users ADD COLUMN specialty VARCHAR;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='medical_license') THEN
        ALTER TABLE users ADD COLUMN medical_license VARCHAR;
    END IF;
END $$;

-- 2. Reparación de la Tabla de Consultas (Tracking de Envíos)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultations' AND column_name='email_sent_at') THEN
        ALTER TABLE consultations ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultations' AND column_name='whatsapp_sent_at') THEN
        ALTER TABLE consultations ADD COLUMN whatsapp_sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Verificación Final
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'consultations')
ORDER BY table_name, column_name;