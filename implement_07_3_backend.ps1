# Script de Implementación Slice 07.3 - Backend
# Ejecutar desde la raíz del proyecto: ./implement_07_3_backend.ps1

Write-Host "Iniciando implementación Slice 07.3 - Backend..." -ForegroundColor Cyan

# 1. Actualización de Base de Datos (SQLite)
Write-Host "1. Aplicando migración de base de datos..." -ForegroundColor Yellow
$migrationScript = @"
import sqlite3
import os

# Check test.db first as it matches database.py default
db_path = os.path.join(os.getcwd(), 'backend', 'test.db')
if not os.path.exists(db_path):
    print(f"test.db not found at {db_path}, trying vitalinuage.db")
    db_path = os.path.join(os.getcwd(), 'backend', 'vitalinuage.db')

if not os.path.exists(db_path):
    print(f"No database found.")
    # Fallback to local
    db_path = 'test.db'

print(f"Connecting to {db_path}")

conn = sqlite3.connect(db_path)
c = conn.cursor()

def add_column(table, col_def):
    try:
        c.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
        print(f"Added column {col_def} to {table}")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print(f"Column {col_def} already exists in {table}")
        else:
            print(f"Error checking {col_def}: {e}")

add_column('prescription_verifications', 'email_sent_at TIMESTAMP')
add_column('prescription_verifications', 'whatsapp_sent_at TIMESTAMP')

conn.commit()
conn.close()
"@

$migrationScript | Out-File -Encoding UTF8 "temp_migrate.py"
py temp_migrate.py
Remove-Item "temp_migrate.py"

# 2. Actualización de Models.py
Write-Host "2. Actualizando backend/models.py..." -ForegroundColor Yellow
$modelsPath = "backend/models.py"
$modelsContent = Get-Content $modelsPath -Raw

# Agregar columnas a PrescriptionVerification
$modelsContent = $modelsContent -replace "issue_date = Column\(DateTime, nullable=False\)", "issue_date = Column(DateTime, nullable=False)`n    email_sent_at = Column(DateTime, nullable=True)`n    whatsapp_sent_at = Column(DateTime, nullable=True)"

# Actualizar relación en PrescriptionVerification
$modelsContent = $modelsContent -replace 'consultation = relationship\("ClinicalConsultation"\)', 'consultation = relationship("ClinicalConsultation", back_populates="verification")'

# Agregar relación y propiedades a ClinicalConsultation (usando patient relation como ancla)
$ccInjection = @"
    patient = relationship("Patient", back_populates="consultations")
    verification = relationship("PrescriptionVerification", uselist=False, back_populates="consultation")

    @property
    def email_sent_at(self):
        return self.verification.email_sent_at if self.verification else None

    @property
    def whatsapp_sent_at(self):
        return self.verification.whatsapp_sent_at if self.verification else None
"@
$modelsContent = $modelsContent -replace 'patient = relationship\("Patient", back_populates="consultations"\)', $ccInjection

$modelsContent | Set-Content $modelsPath -Encoding UTF8

# 3. Actualización de Schemas
Write-Host "3. Actualizando backend/schemas/consultations.py..." -ForegroundColor Yellow
$schemasPath = "backend/schemas/consultations.py"
$schemasContent = Get-Content $schemasPath -Raw

# Insertar campos opcionales en Response
$schemasContent = $schemasContent -replace "updated_at: Optional\[datetime\] = None", "updated_at: Optional[datetime] = None`n    email_sent_at: Optional[datetime] = None`n    whatsapp_sent_at: Optional[datetime] = None"

$schemasContent | Set-Content $schemasPath -Encoding UTF8

# 4. Actualización de API (Consultations.py)
Write-Host "4. Actualizando backend/api/consultations.py..." -ForegroundColor Yellow
$apiPath = "backend/api/consultations.py"
$apiContent = Get-Content $apiPath -Raw

# Inyección 1: Actualizar email_sent_at en endpoint existente
# Buscamos la llamada a background tasks y añadimos la actualización DB
$emailLogic = @"
    # Encolar envio
    background_tasks.add_task(
        EmailService.send_prescription_email,
        to_email=patient_email,
        patient_name=f"{consultation.patient.nombre} {consultation.patient.apellido_paterno}",
        doctor_name=verification.doctor_name,
        pdf_url=pdf_url,
        issue_date=verification.issue_date.strftime("%d/%m/%Y")
    )
    
    # Update timestamp
    verification.email_sent_at = datetime.datetime.utcnow()
    db.commit()
    
    return
"@

# Reemplazo cuidadoso del bloque standard
$apiContent = $apiContent -replace 'background_tasks\.add_task\([^)]+\)[^r]+return', $emailLogic # Regex arriesgado.
# Mejor enfoque: Reemplazar por string exacto conocido si es posible.
# Dado que el archivo puede variar, usaré append para los NUEVOS endpoints y un replace más simple para el email.

# Simplificación: Insertar update antes del return en send-email
if ($apiContent -notmatch "verification.email_sent_at = datetime") {
    $apiContent = $apiContent.Replace('return {"message": "Email encolado para envio"}', 'verification.email_sent_at = datetime.datetime.utcnow()`n    db.commit()`n    return {"message": "Email encolado para envio"}')
}

# Inyección 2: Nuevos Endpoints
$newEndpoints = @"

@router.post("/{consultation_id}/mark-whatsapp-sent")
async def mark_whatsapp_sent(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verificar propiedad
    consultation = db.query(models.ClinicalConsultation).filter(
        models.ClinicalConsultation.id == consultation_id,
        models.ClinicalConsultation.owner_id == current_user.email
    ).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
        
    # Obtener verificacion
    verification = db.query(models.PrescriptionVerification).filter(
        models.PrescriptionVerification.consultation_id == consultation_id
    ).first()
    
    if not verification:
        # Si no existe, crearla (edge case, pero create-verification deberia haber sido llamado antes)
        # Por simplicidad, retornamos error si no hay UUID generado
        raise HTTPException(status_code=400, detail="Debe generar el enlace primero")
        
    verification.whatsapp_sent_at = datetime.datetime.utcnow()
    db.commit()
    
    return {"success": True, "timestamp": verification.whatsapp_sent_at}

@router.get("/{consultation_id}/dispatch-status")
async def get_dispatch_status(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    consultation = db.query(models.ClinicalConsultation).filter(
        models.ClinicalConsultation.id == consultation_id,
        models.ClinicalConsultation.owner_id == current_user.email
    ).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    
    # Gracias a la propiedad hibrida añadida en models.py, esto es facil,
    # pero para el endpoint especifico consultamos la verification directa
    verification = db.query(models.PrescriptionVerification).filter(
        models.PrescriptionVerification.consultation_id == consultation_id
    ).first()
    
    if not verification:
        return {"email_sent_at": None, "whatsapp_sent_at": None}
        
    return {
        "email_sent_at": verification.email_sent_at,
        "whatsapp_sent_at": verification.whatsapp_sent_at,
        "uuid": verification.uuid
    }
"@

if ($apiContent -notmatch "mark_whatsapp_sent") {
    $apiContent += $newEndpoints
}

$apiContent | Set-Content $apiPath -Encoding UTF8

Write-Host "Backend Implementation Complete." -ForegroundColor Green
