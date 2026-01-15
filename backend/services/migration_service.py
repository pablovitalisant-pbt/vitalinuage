from typing import Optional, Tuple

class LegacyMigrationService:
    def extract_biometrics(self, text: str) -> Tuple[Optional[float], Optional[float]]:
        """
        Parses 'Exploracion Fisica' text to extract Weight (kg) and Height (cm).
        Returns (weight_kg, height_cm).
        """
        text = text.lower() if text else ""
        
        # Helper to normalize float strings
        def normalize_val(val_str):
            try:
                return float(val_str.replace(',', '.'))
            except:
                return None

        import re
        
        weight = None
        height = None

        # --- Weight Extraction ---
        # Priority 1: "Peso (kg)= 102"
        w_p1 = re.search(r'(?:peso|weight)\s*(?:\(kg\))?\s*[=:]\s*(\d+(?:[\.,]\d+)?)', text)
        if w_p1:
            weight = normalize_val(w_p1.group(1))
        else:
            # Priority 2: "80kg"
            w_p2 = re.search(r'(\d+(?:[\.,]\d+)?)\s*(?:kg|kilos?)\b', text)
            if w_p2:
                weight = normalize_val(w_p2.group(1))

        # --- Height Extraction ---
        # Priority 1: "Estatura(cm)= 148"
        h_p1 = re.search(r'(?:estatura|talla|height)\s*(?:\(cm\)|(?:\(mts?\)))?\s*[=:]\s*(\d+(?:[\.,]\d+)?)', text)
        height_raw = None
        is_meters_context = False
        
        if h_p1:
            height_raw = h_p1.group(1)
        else:
            # Priority 2: "1.70mt" or "170 cm"
            h_p2 = re.search(r'(\d+(?:[\.,]\d+)?)\s*(?:cm|mts?\.?)\b', text)
            if h_p2:
                height_raw = h_p2.group(1)
                if 'mt' in h_p2.group(0):
                    is_meters_context = True

        if height_raw:
            val = normalize_val(height_raw)
            if val:
                # Normalization Rule: If < 3.0 (and likely meters), convert to cm
                # Unless context clearly said cm (Plan says if not explicitly cm, but here we simplify)
                # If "1.70" comes from "1.70mt", is_meters_context is True.
                # If "148" comes from "Estatura(cm)= 148", val is > 3.0.
                if is_meters_context or val < 3.0:
                    val *= 100
                height = round(val, 1) # Keep 1 decimal for cm? Or int? Models say Float.

        return weight, height

    def process_consultation_row(self, row: dict, patient_map: dict, db_session):
        """
        Processes a single row from Consultas CSV.
        - Identifies/Creates Patient (forcing doctor_id=15).
        - Creates Consultation linked to Patient.
        """
        from backend.models import Patient, ClinicalConsultation
        from sqlalchemy.future import select
        
        legacy_id = row.get('Paciente')
        if not legacy_id:
            return # Skip if no patient link
            
        patient_data = patient_map.get(legacy_id)
        if not patient_data:
            # Decide: Log missing patient? For now just return to avoid crash
            print(f"Warning: Patient ID {legacy_id} not found in map.")
            return

        rut = patient_data.get('RUN', '')
        if not rut:
            # Try fallback if RUN is empty but maybe Identificacion exists?
            rut = patient_data.get('Identificacion', '')
            
        if not rut:
            print(f"Warning: Patient {legacy_id} has no RUT.")
            return

        # Clean RUT? "12.345.678-9" -> "12345678-9" or allow points?
        # Standardizing on cleaning points for robust comparison, preserving hyphen
        clean_rut = rut.replace('.', '').strip()
        
        # Check DB - SCOPED TO DOCTOR
        # We only want to reuse specific patient if it belongs to THIS doctor (or we decide global uniqueness?)
        # Given "UniqueConstraint('dni', 'owner_id')", we definitely should scope lookup to owner_id.
        # Otherwise we might attach data to another doctor's patient.
        target_owner = "carlosebrav@gmail.com"
        
        # Verify Engine URL once
        # from backend.db_core import engine
        # print(f"DEBUG SERVICE ENGINE: {engine.url}")

        stmt = select(Patient).where(
            (Patient.dni == clean_rut) & 
            (Patient.owner_id == target_owner)
        )
        result = db_session.execute(stmt)
        patient = result.scalars().first()
        
        # ANTECEDENTES (Slice 36.4)
        app = patient_data.get('Antecedentes Patologicos Personales', '').strip()
        ahf = patient_data.get('Antecedentes Heredo Familiares', '').strip()
        merged_antecedentes = []
        if app and app.lower() not in ['no informado', 'no informados', 'sin antecedentes']:
            merged_antecedentes.append(f"Personales: {app}")
        if ahf and ahf.lower() not in ['no informado', 'no informados', 'sin antecedentes']:
            merged_antecedentes.append(f"Familiares: {ahf}")
        
        final_antecedentes = "\n".join(merged_antecedentes)

        if not patient:
            # Create Patient
            # ... (Creation Logic) ...
            # print(f"Creating Patient {clean_rut} ...")
            full_name = patient_data.get('Nombre', 'Unknown').strip()
            parts = full_name.split()
            if len(parts) >= 3:
                nombre = " ".join(parts[:-2])
                apellido_p = parts[-2]
                apellido_m = parts[-1]
            elif len(parts) == 2:
                nombre = parts[0]
                apellido_p = parts[1]
                apellido_m = ""
            else:
                nombre = full_name
                apellido_p = ""
                apellido_m = ""

            dob = patient_data.get('Fecha de Nacimiento', '')
            if not dob: dob = "1900-01-01"

            patient = Patient(
                nombre=nombre,
                apellido_paterno=apellido_p,
                apellido_materno=apellido_m,
                dni=clean_rut,
                fecha_nacimiento=dob,
                sexo=patient_data.get('Sexo', 'M'),
                telefono=patient_data.get('Telefono', ''),
                email=patient_data.get('Email', ''),
                direccion=patient_data.get('Direccion', ''),
                observaciones=patient_data.get('Notas', ''),
                antecedentes_morbidos=final_antecedentes, # Slice 36.4: Enriched
                owner_id=target_owner 
            )
            db_session.add(patient)
            db_session.flush() # Get ID
            db_session.refresh(patient)
        else:
            # UPDATE Existing Patient (Slice 36.4 Rescue)
            # Only update if current is empty or we want to overwrite/append?
            # User instruction: "Si el paciente ya existe, haz un UPDATE de ese campo."
            if final_antecedentes:
                if patient.antecedentes_morbidos:
                     # Avoid duplication if running multiple times?
                     # Simple check
                     if final_antecedentes not in patient.antecedentes_morbidos:
                         patient.antecedentes_morbidos += f"\n{final_antecedentes}"
                else:
                    patient.antecedentes_morbidos = final_antecedentes
                db_session.add(patient) # Mark as dirty
        
        # Create Consultation
        # DATE PARSING (Slice 36.4)
        from datetime import datetime
        raw_date = row.get('Creation Date', '')
        created_at = datetime.utcnow() # Fallback
        if raw_date:
            try:
                # Format: "Nov 29, 2023 9:38 am"
                created_at = datetime.strptime(raw_date, '%b %d, %Y %I:%M %p')
            except ValueError:
                print(f"Warning: Could not parse date {raw_date}")

        raw_text = row.get('Exploracion Fisica', '')
        weight, height = self.extract_biometrics(raw_text)
        
        consultation = ClinicalConsultation(
            patient_id=patient.id,
            owner_id=target_owner,
            motivo_consulta="Atención Histórica", # Updated from Spec
            created_at=created_at, # Slice 36.4: Real Date
            diagnostico=row.get('Diagnostico', 'Sin Diagnóstico'),
            examen_fisico=raw_text,
            plan_tratamiento=row.get('Tratamiento', ''),
            peso_kg=weight,
            estatura_cm=height,
        )
        db_session.add(consultation)
        db_session.flush()
