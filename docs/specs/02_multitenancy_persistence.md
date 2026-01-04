# 02 Multitenancy Persistence Specification

## 1. Objetivo
Implementar la persistencia de datos de pacientes en base de datos Relacional (SQLite/Postgres) respetando el aislamiento (Multitenancy) mediante `owner_id`.

## 2. Archivos Afectados

### Backend
*   `backend/models.py`: Definición de la tabla `patients`.
*   `backend/crud.py`: Funciones para crear y leer pacientes con filtro obligatorio `owner_id`.
*   `backend/api/patients.py`: Integración con `crud`, inyectando `owner_id` desde el token (seguridad).
*   `backend/database.py`: Verificaciones de conexión.
*   `alembic.ini` / `migrations/`: (Opcional/Recomendado) Estructura de migraciones.

## 3. Especificación Técnica

### 3.1 Modelo de Datos (`backend/models.py`)
Se añadirá la clase `Patient` mapeando la tabla `patients`.
El campo `owner_id` será clave foránea lógica a `User.email` (dado que el token usa email como ID actualmente) o simplemente un String indexado si queremos desacoplamiento flexible.
Decisión: String Indexado `owner_id`.

```python
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    
    # Identificación
    nombre = Column(String, index=True)
    apellido_paterno = Column(String, index=True)
    apellido_materno = Column(String, nullable=True)
    dni = Column(String, unique=True, index=True)
    fecha_nacimiento = Column(String) # Guardaremos ISO YYYY-MM-DD
    sexo = Column(String, default="M")

    # Multitenancy
    owner_id = Column(String, index=True, nullable=False)
    
    # ... resto de campos mapeados del esquema ...
```

### 3.2 Lógica CRUD (`backend/crud.py`)
Todas las operaciones DEBEN requerir `owner_id`.

*   `create_patient(db, patient: Schema, owner_id: str)`: Sobreescribe cualquier `owner_id` que venga en el payload con el del usuario autenticado.
*   `get_patients(db, owner_id: str, ...)`: Filtra `filter(Patient.owner_id == owner_id)`.

### 3.3 Endpoint (`backend/api/patients.py`)
Se debe modificar el endpoint para obtener el `current_user`.

```python
@router.post("")
def create_patient(
    patient: schemas.PatientCreate, 
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user) # Inyección de dependencia Auth
):
    return crud.create_patient(db=db, patient=patient, owner_id=current_user.email)
```

### 3.4 Estrategia de Migración
Dado que la tabla `patients` NO existe en el modelo actual (`models.py`), SQLAlchemy `create_all` es suficiente para crearla en entornos de desarrollo/test.
Sin embargo, para cumplir con el requisito de robustez:
1.  Se inicializará Alembic: `alembic init alembic`.
2.  Se configurará `alembic.ini` y `env.py` para leer `DATABASE_URL` y cargar `models.Base`.
3.  Se generará una revisión: `alembic revision --autogenerate -m "Add patients table with owner_id"`.
4.  Se aplicará: `alembic upgrade head`.

*Esta configuración de Alembic se realizará si el usuario lo aprueba como parte del Slice, o se pospondrá si se prefiere agilidad (create_all).*
**Propuesta:** Usar `create_all` por ahora para mantener el Slice < 200 líneas (regla de oro), ya que la configuración completa de Alembic suele generar varios archivos. Si el usuario insiste en Alembic, lo haremos, pero recomiendo `create_all` para este Slice y Alembic para el siguiente cuando haya cambios de esquema sobre datos existentes.

## 4. Plan de Pruebas (Fase B Update)
Actualizar los tests existentes para que pasen con la persistencia real.
*   El test de integración borrará/creará datos reales en DB de prueba.
*   Verificar que un usuario NO pueda ver pacientes de otro `owner_id` (RLS logic check).

## 5. Preguntas Clave
*   ¿Confirmamos que `owner_id` se mapea al `email` del usuario (como está en el token actual)? SÍ.
*   ¿Confirmamos usar `create_all` para simplificar y cumplir <200 líneas, vs Alembic full setup? (Sugerido: `create_all`).
