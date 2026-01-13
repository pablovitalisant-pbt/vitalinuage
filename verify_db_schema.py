"""
Script de verificación del esquema de base de datos
Verifica que las columnas del hotfix existan en Neon
"""
import os
from sqlalchemy import create_engine, text, inspect

# Usar la misma DATABASE_URL que la aplicación
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL no está configurada")
    exit(1)

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

print("=" * 80)
print("VERIFICACIÓN DE ESQUEMA DE BASE DE DATOS")
print("=" * 80)

# Verificar columnas de clinical_consultations
print("\n📋 TABLA: clinical_consultations")
print("-" * 80)
columns = inspector.get_columns('clinical_consultations')
expected_columns = [
    'peso_kg', 'estatura_cm', 'imc', 'presion_arterial', 
    'frecuencia_cardiaca', 'temperatura_c', 'cie10_code', 'cie10_description'
]

found_columns = [col['name'] for col in columns]
print(f"Total de columnas: {len(found_columns)}")

for col_name in expected_columns:
    status = "✅" if col_name in found_columns else "❌"
    print(f"{status} {col_name}")

# Verificar columnas de patients
print("\n📋 TABLA: patients")
print("-" * 80)
columns = inspector.get_columns('patients')
expected_columns = ['alergias', 'antecedentes_morbidos']

found_columns = [col['name'] for col in columns]
print(f"Total de columnas: {len(found_columns)}")

for col_name in expected_columns:
    status = "✅" if col_name in found_columns else "❌"
    print(f"{status} {col_name}")

print("\n" + "=" * 80)
print("VERIFICACIÓN COMPLETADA")
print("=" * 80)
