
import csv
import io
import zipfile
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.models import Patient, ClinicalConsultation

class PortabilityService:
    
    @staticmethod
    def generate_export_zip(db: Session, doctor_id: str) -> bytes:
        """
        Generates a ZIP file containing patients.csv and consultations.csv
        for the specified doctor (owner_id).
        """
        # 1. Fetch Data
        patients = db.query(Patient).filter(Patient.owner_id == doctor_id).all()
        
        # Consultations needed linking to patient ID? Or verify owner_id matches?
        # Typically consultations also have owner_id.
        consultations = db.query(ClinicalConsultation).filter(ClinicalConsultation.owner_id == doctor_id).all()

        # 2. Create In-Memory CSVs
        # Patients CSV
        patients_buffer = io.StringIO()
        p_fieldnames = [
            'dni', 'nombre', 'apellido_paterno', 'apellido_materno', 
            'fecha_nacimiento', 'sexo', 'email', 'telefono', 
            'direccion', 'ocupacion', 'estado_civil', 'antecedentes_morbidos'
        ]
        p_writer = csv.DictWriter(patients_buffer, fieldnames=p_fieldnames)
        p_writer.writeheader()
        
        # Map IDs to DNI for consultation linkage
        pk_to_dni = {}

        for p in patients:
            pk_to_dni[p.id] = p.dni
            p_writer.writerow({
                'dni': p.dni,
                'nombre': p.nombre,
                'apellido_paterno': p.apellido_paterno,
                'apellido_materno': p.apellido_materno or '',
                'fecha_nacimiento': p.fecha_nacimiento,
                'sexo': p.sexo or '',
                'email': p.email or '',
                'telefono': p.telefono or '',
                'direccion': p.direccion or '',
                'ocupacion': p.ocupacion or '',
                'estado_civil': p.estado_civil or '',
                'antecedentes_morbidos': p.antecedentes_morbidos or ''
            })
            
        # Consultations CSV
        consultations_buffer = io.StringIO()
        c_fieldnames = [
            'patient_dni', 'date', 'motivo', 'diagnostico', 
            'tratamiento', 'examen_fisico', 'peso_kg', 'talla_cm'
        ]
        c_writer = csv.DictWriter(consultations_buffer, fieldnames=c_fieldnames)
        c_writer.writeheader()
        
        for c in consultations:
            p_dni = pk_to_dni.get(c.patient_id)
            if p_dni:
                c_writer.writerow({
                    'patient_dni': p_dni,
                    'date': c.created_at.isoformat() if c.created_at else '',
                    'motivo': c.motivo_consulta,
                    'diagnostico': c.diagnostico,
                    'tratamiento': c.plan_tratamiento,
                    'examen_fisico': c.examen_fisico or '',
                    'peso_kg': c.peso_kg or '',
                    'talla_cm': c.estatura_cm or ''
                })

        # 3. Create ZIP
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Use utf-8-sig for Excel compatibility
            zf.writestr('patients.csv', patients_buffer.getvalue().encode('utf-8-sig'))
            zf.writestr('consultations.csv', consultations_buffer.getvalue().encode('utf-8-sig'))
            
        zip_buffer.seek(0)
        return zip_buffer.getvalue()

    @staticmethod
    def process_import_zip(db: Session, doctor_id: str, zip_bytes: bytes) -> dict:
        """
        Processes an imported ZIP file.
        Returns statistics dict.
        """
        stats = {
            "patients_processed": 0, "patients_inserted": 0, "patients_skipped": 0,
            "consultations_processed": 0, "consultations_inserted": 0, "consultations_skipped": 0,
            "errors": []
        }
        
        try:
            zip_buffer = io.BytesIO(zip_bytes)
            with zipfile.ZipFile(zip_buffer, 'r') as zf:
                file_list = zf.namelist()
                
                if 'patients.csv' not in file_list or 'consultations.csv' not in file_list:
                     raise ValueError("ZIP must contain patients.csv and consultations.csv")
                
                # 1. Process Patients
                # Decode: assumed utf-8 or utf-8-sig (autodetect implies trying)
                # We enforce utf-8-sig reading
                with zf.open('patients.csv') as f:
                    content = f.read().decode('utf-8-sig')
                    reader = csv.DictReader(io.StringIO(content))
                    
                    # Create cache of DNI -> ID for consultation linking
                    dni_to_pk = {}
                    
                    for row in reader:
                        stats["patients_processed"] += 1
                        dni = row.get('dni', '').strip()
                        if not dni: continue
                        
                        # Check exist
                        existing = db.query(Patient).filter(
                            Patient.owner_id == doctor_id,
                            Patient.dni == dni
                        ).first()
                        
                        if existing:
                            dni_to_pk[dni] = existing.id
                            stats["patients_skipped"] += 1
                            # Optional: Update? Spec says skip or update. Let's skip for safety or update nulls.
                        else:
                            # Insert
                            new_p = Patient(
                                owner_id=doctor_id,
                                dni=dni,
                                nombre=row.get('nombre', 'Unknown'),
                                apellido_paterno=row.get('apellido_paterno', 'Unknown'),
                                apellido_materno=row.get('apellido_materno', ''),
                                fecha_nacimiento=row.get('fecha_nacimiento', '1900-01-01'),
                                sexo=row.get('sexo', 'M'),
                                email=row.get('email', ''),
                                telefono=row.get('telefono', ''),
                                direccion=row.get('direccion', ''),
                                ocupacion=row.get('ocupacion', ''),
                                estado_civil=row.get('estado_civil', ''),
                                antecedentes_morbidos=row.get('antecedentes_morbidos', '')
                            )
                            db.add(new_p)
                            db.flush() # Get ID
                            dni_to_pk[dni] = new_p.id
                            stats["patients_inserted"] += 1
                            
                # 2. Process Consultations
                with zf.open('consultations.csv') as f:
                    content = f.read().decode('utf-8-sig')
                    reader = csv.DictReader(io.StringIO(content))
                    
                    for row in reader:
                        stats["consultations_processed"] += 1
                        p_dni = row.get('patient_dni', '').strip()
                        if not p_dni or p_dni not in dni_to_pk:
                            stats["errors"].append(f"Consultation row {stats['consultations_processed']}: Patient DNI {p_dni} not found.")
                            stats["consultations_skipped"] += 1
                            continue
                            
                        # Insert
                        try:
                            created_at = datetime.fromisoformat(row.get('date'))
                        except:
                            created_at = datetime.utcnow()
                            
                        # Try to avoid exact duplicates? (Date + Patient)
                        # For simplicity in V1, insert (user requested consistency)
                        
                        new_c = ClinicalConsultation(
                            owner_id=doctor_id,
                            patient_id=dni_to_pk[p_dni],
                            created_at=created_at,
                            motivo_consulta=row.get('motivo', 'Imported'),
                            diagnostico=row.get('diagnostico', ''),
                            plan_tratamiento=row.get('tratamiento', ''),
                            examen_fisico=row.get('examen_fisico', ''),
                            peso_kg=float(row.get('peso_kg')) if row.get('peso_kg') else None,
                            estatura_cm=float(row.get('talla_cm')) if row.get('talla_cm') else None
                        )
                        db.add(new_c)
                        stats["consultations_inserted"] += 1
                
                db.commit()
                
        except Exception as e:
            db.rollback()
            raise e
            
        return stats
