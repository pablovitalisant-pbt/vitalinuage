import os
from sqlalchemy import text
from database import engine, Base
import models

def migrate():
    print("Conectando a Neon para sincronizar esquema...")
    # 1. Intentar crear tablas nuevas
    Base.metadata.create_all(bind=engine)
    
    # 2. Agregar columnas faltantes a tablas existentes (Postgres syntax)
    with engine.connect() as conn:
        cols_to_add = [
            ("users", "is_onboarded", "BOOLEAN DEFAULT FALSE"),
            ("users", "professional_name", "VARCHAR"),
            ("users", "specialty", "VARCHAR"),
            ("users", "medical_license", "VARCHAR")
        ]
        for table, col, col_type in cols_to_add:
            try:
                # En Postgres usamos ALTER TABLE ... ADD COLUMN IF NOT EXISTS
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                conn.commit()
                print(f"Verificada columna: {table}.{col}")
            except Exception as e:
                print(f"Nota en {col}: {e}")
    print("Sincronizacion con Neon completada.")

if __name__ == '__main__':
    migrate()