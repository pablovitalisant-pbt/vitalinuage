# Imports moved inside methods for lazy loading
# from reportlab.pdfgen import canvas
# from reportlab.lib.units import mm as reportlab_mm
# from reportlab.lib.pagesizes import A5
# from weasyprint import HTML
from sqlalchemy.orm import Session
from typing import Optional
from backend import models
import tempfile
import os


class PDFService:
    """
    Servicio de generaciÃ³n de PDFs con soporte para coordenadas personalizadas.
    Estrategia hÃ­brida: ReportLab para coordenadas exactas, WeasyPrint para templates.
    """
    
    @staticmethod
    def mm_to_points(millimeters: float) -> float:
        """
        Convierte milÃ­metros a puntos PDF.
        1mm = 2.83465 points (estÃ¡ndar PDF)
        
        Args:
            millimeters: Valor en milÃ­metros
            
        Returns:
            float: Valor en puntos PDF
        """
        return millimeters * 2.83465
    
    @staticmethod
    def get_active_map(doctor_email: str, db: Session) -> Optional[models.PrescriptionMap]:
        """
        Obtiene el mapa de coordenadas activo del mÃ©dico.
        
        Args:
            doctor_email: Email del mÃ©dico
            db: SesiÃ³n de base de datos
            
        Returns:
            PrescriptionMap si existe y estÃ¡ activo, None en caso contrario
        """
        return db.query(models.PrescriptionMap).filter(
            models.PrescriptionMap.doctor_id == doctor_email,
            models.PrescriptionMap.is_active == True
        ).first()
    
    @staticmethod
    def extract_field_value(consultation: models.ClinicalConsultation, field_key: str) -> str:
        """
        Mapea field_key a datos reales de la consulta.
        
        Args:
            consultation: Consulta clÃ­nica
            field_key: Clave del campo ('patient_name', 'diagnosis', etc.)
            
        Returns:
            str: Valor del campo o cadena vacÃ­a si no existe
        """
        FIELD_MAPPING = {
            'patient_name': lambda c: f"{c.patient.nombre} {c.patient.apellido_paterno}",
            'patient_dni': lambda c: c.patient.dni or "N/A",
            'date': lambda c: c.created_at.strftime('%d/%m/%Y') if c.created_at else "",
            'diagnosis': lambda c: c.diagnosis or "",
            'treatment': lambda c: c.treatment or "",
            'doctor_signature': lambda c: "Firma y Sello MÃ©dico"
        }
        
        mapper = FIELD_MAPPING.get(field_key)
        return mapper(consultation) if mapper else ""
    
    @classmethod
    def generate_with_coordinates(
        cls,
        consultation: models.ClinicalConsultation,
        prescription_map: models.PrescriptionMap,
        output_path: str,
        db: Session = None
    ) -> bytes:
        """
        Genera PDF usando ReportLab con coordenadas exactas.
        
        Args:
            consultation: Datos de la consulta clÃ­nica
            prescription_map: ConfiguraciÃ³n de coordenadas
            output_path: Ruta temporal para el PDF
            db: SesiÃ³n de base de datos (para crear verificaciones QR)
        
        Returns:
            bytes: Contenido del PDF generado
        """
        from reportlab.lib.utils import ImageReader
        from services.qr_service import generate_qr_image
        import uuid as uuid_lib
        import datetime
        
        import uuid as uuid_lib
        import datetime
        from reportlab.pdfgen import canvas
        
        # 1. Crear canvas con dimensiones del mapa
        width_pt = cls.mm_to_points(prescription_map.canvas_width_mm)
        height_pt = cls.mm_to_points(prescription_map.canvas_height_mm)
        
        c = canvas.Canvas(output_path, pagesize=(width_pt, height_pt))
        
        # 2. Si hay imagen de fondo, renderizarla primero
        if prescription_map.background_image_url:
            # TODO: Implementar en fase futura
            pass
        
        # 3. Iterar sobre fields_config y posicionar cada campo
        for field_config in prescription_map.fields_config:
            if field_config['field_key'] == 'qr_code' and db:
                # Get doctor info
                doctor = db.query(models.User).filter(
                    models.User.email == consultation.owner_id
                ).first()
                doctor_name = doctor.professional_name if doctor and doctor.professional_name else "Dr. Vitalinuage"
                
                # Generar registro de verificaciÃ³n
                verification_uuid = str(uuid_lib.uuid4())
                verification = models.PrescriptionVerification(
                    uuid=verification_uuid,
                    consultation_id=consultation.id,
                    doctor_email=consultation.owner_id,
                    doctor_name=doctor_name,
                    issue_date=datetime.datetime.utcnow()
                )
                db.add(verification)
                db.commit()
                
                # Generar QR
                qr_url = f"https://vitalinuage.com/v/{verification_uuid}"
                qr_image = generate_qr_image(qr_url, field_config.get('max_width_mm', 25.0))
                
                # Posicionar en canvas
                x_pt = cls.mm_to_points(field_config['x_mm'])
                y_pt = height_pt - cls.mm_to_points(field_config['y_mm'])
                size_pt = cls.mm_to_points(field_config.get('max_width_mm', 25.0))
                
                # Dibujar imagen
                c.drawImage(
                    ImageReader(qr_image),
                    x_pt,
                    y_pt - size_pt,  # Ajuste para alineaciÃ³n
                    width=size_pt,
                    height=size_pt,
                    preserveAspectRatio=True
                )
            else:
                # LÃ³gica existente para campos de texto
                field_value = cls.extract_field_value(consultation, field_config['field_key'])
                
                # Convertir coordenadas mm â†’ puntos
                x_pt = cls.mm_to_points(field_config['x_mm'])
                # IMPORTANTE: ReportLab usa origen en esquina inferior izquierda
                # Invertir Y: y_pdf = height - y_mm
                y_pt = height_pt - cls.mm_to_points(field_config['y_mm'])
                
                # Configurar fuente
                font_size = field_config.get('font_size_pt', 10)
                c.setFont("Helvetica", font_size)
                
                # Dibujar texto
                c.drawString(x_pt, y_pt, field_value)
        
        # 4. Finalizar y guardar
        c.save()
        
        # 5. Leer bytes del archivo
        with open(output_path, 'rb') as f:
            return f.read()
    
    @classmethod
    def generate_with_template(
        cls,
        consultation: models.ClinicalConsultation,
        template_id: str = "modern"
    ) -> bytes:
        """
        Genera PDF usando WeasyPrint con templates HTML/CSS.
        Fallback para mÃ©dicos sin mapa configurado.
        
        Args:
            consultation: Datos de la consulta clÃ­nica
            template_id: ID del template ('minimal', 'modern', 'classic')
        
        Returns:
            bytes: Contenido del PDF generado
        """
        from backend.pdf_templates import MINIMAL_TEMPLATE, MODERN_TEMPLATE, CLASSIC_TEMPLATE
        from jinja2 import Template
        try:
            from weasyprint import HTML
        except ImportError:
             raise Exception("WeasyPrint module not found. Please install backend dependencies.")


        
        # 1. Seleccionar template
        templates = {
            'minimal': MINIMAL_TEMPLATE,
            'modern': MODERN_TEMPLATE,
            'classic': CLASSIC_TEMPLATE
        }
        template_html = templates.get(template_id, MODERN_TEMPLATE)
        
        # 2. Preparar datos para el template
        # Create mock objects that match template structure
        class MockDoctor:
            professional_name = "Dr. Vitalinuage"
            specialty = "Medicina General"
            phone = "N/A"
            address = "Consultorio MÃ©dico"
        
        class MockPatient:
            def __init__(self, patient):
                self.nombre = patient.nombre
                self.apellido_paterno = patient.apellido_paterno
                self.dni = patient.dni or "N/A"
        
        class MockConsultation:
            def __init__(self, consultation):
                self.diagnosis = consultation.diagnosis or ""
                self.treatment = consultation.treatment or ""
        
        context = {
            'doctor': MockDoctor(),
            'patient': MockPatient(consultation.patient),
            'consultation': MockConsultation(consultation),
            'date': consultation.created_at.strftime('%d/%m/%Y') if consultation.created_at else "",
            'logo_base64': None,  # No logo for now
            'primary_color': '#4a90e2',
            'secondary_color': '#2c3e50'
        }
        
        # 3. Renderizar template
        template = Template(template_html)
        html_content = template.render(**context)
        
        # 4. Generar PDF con WeasyPrint
        pdf_bytes = HTML(string=html_content).write_pdf()
        
        return pdf_bytes
    
    @staticmethod
    def _parse_date(date_value):
        """
        Helper safely parse dates from string or datetime objects.
        Returns datetime.date or None.
        """
        import datetime
        if not date_value:
            return None
        
        if isinstance(date_value, (datetime.date, datetime.datetime)):
            return date_value
            
        if isinstance(date_value, str):
            try:
                # Try ISO format first (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
                return datetime.datetime.fromisoformat(date_value.replace('Z', '+00:00')).date()
            except ValueError:
                # Try simple date
                try:
                    return datetime.datetime.strptime(date_value, '%Y-%m-%d').date()
                except ValueError:
                    return None
        return None

    @classmethod
    def generate_from_html_file(
        cls,
        consultation: models.ClinicalConsultation,
        verification_uuid: str = "",
        db: Session = None  # New Argument injected from API
    ) -> bytes:
        """
        Generates PDF using the A5 HTML template file.
        Uses db session to fetch or create PrescriptionVerification.
        """
        import jinja2
        import os
        import datetime
        import uuid as uuid_lib
        
        # Paths
        base_dir = os.path.dirname(os.path.dirname(__file__)) # backend/
        template_dir = os.path.join(base_dir, 'templates')
        env = jinja2.Environment(loader=jinja2.FileSystemLoader(template_dir))
        template = env.get_template('recipe_template.html')
        
        # Context Data
        age = "N/A"
        dob = cls._parse_date(consultation.patient.fecha_nacimiento) if consultation.patient else None
        
        if dob:
            today = datetime.date.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        doctor = "Dr. Vitalinuage" # Fallback
        specialty = "Medicina General"
        
        # Try to resolve doctor from owner_id (email) if possible, or use passed data?
        # current_user is not passed here directly, but owner_id is on consultation.
        
        consult_date = cls._parse_date(consultation.created_at)
        date_str = consult_date.strftime('%d/%m/%Y') if consult_date else datetime.date.today().strftime('%d/%m/%Y')

        # --- SLICE 31.1: UUID & QR Rescue ---
        final_uuid = verification_uuid
        
        if db and not final_uuid:
            # 1. Try to find existing
            verification = db.query(models.PrescriptionVerification).filter(
                models.PrescriptionVerification.consultation_id == consultation.id
            ).first()
            
            if verification:
                final_uuid = verification.uuid
            else:
                # 2. Create new if missing
                try:
                    new_uuid = str(uuid_lib.uuid4())
                    
                    # Resolve Doctor Info for Verification Record
                    doc_user = db.query(models.User).filter(models.User.email == consultation.owner_id).first()
                    doc_name = doc_user.professional_name if doc_user and doc_user.professional_name else doctor
                    
                    new_verification = models.PrescriptionVerification(
                        uuid=new_uuid,
                        consultation_id=consultation.id,
                        doctor_email=consultation.owner_id,
                        doctor_name=doc_name,
                        issue_date=datetime.datetime.utcnow()
                    )
                    db.add(new_verification)
                    db.commit()
                    db.refresh(new_verification)
                    final_uuid = new_uuid
                except Exception as e:
                    print(f"Error creating verification record: {e}")
                    final_uuid = "ERROR-GEN-UUID"

        context = {
            'doctor': {
                'name': doctor,
                'specialty': specialty
            },
            'patient': {
                'name': f"{consultation.patient.nombre} {consultation.patient.apellido_paterno}",
                'dni': consultation.patient.dni or "N/A",
                'age': age
            },
            'date': date_str,
            'treatment': consultation.plan_tratamiento or "",
            'diagnosis': consultation.diagnostico or "",
            'verification_uuid': final_uuid
        }
        
        # Inject QR Code (Existing Logic + Context Update)
        if final_uuid and final_uuid != "PENDING" and final_uuid != "ERROR-GEN-UUID":
             try:
                 from backend.services.qr_service import get_qr_base64
                 verify_url = f"https://vitalinuage.com/v/{final_uuid}"
                 context['qr_base64'] = get_qr_base64(verify_url)
             except Exception as e:
                 print(f"QR Gen failed: {e}")
                 context['qr_base64'] = None
        else:
             context['qr_base64'] = None
        
        html_content = template.render(**context)
        

        
        # WeasyPrint
        # Ensure we are in backend root or set base_url for assets if needed
        try:
             from weasyprint import HTML
        except ImportError:
             raise Exception("WeasyPrint module not found. PDF generation unavailable.")

        pdf_bytes = HTML(string=html_content, base_url=base_dir).write_pdf()
        return pdf_bytes

    @classmethod
    def generate_prescription_pdf(
        cls,
        consultation: models.ClinicalConsultation,
        doctor_email: str,
        db: Session
    ) -> bytes:
        """
        Metodo principal: decide que estrategia usar (coordenadas vs template).
        """
        # 1. Buscar mapa activo del medico
        prescription_map = cls.get_active_map(doctor_email, db)
        
        # 2. Decidir estrategia
        if prescription_map:
            # Usar coordenadas personalizadas (ReportLab)
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
                pdf_bytes = cls.generate_with_coordinates(
                    consultation, 
                    prescription_map, 
                    tmp.name,
                    db=db
                )
                try:
                    os.unlink(tmp.name)
                except:
                    pass
            return pdf_bytes
        else:
            # Usar nueva estrategia: Template HTML A5 del sistema
            from backend import models
            import uuid as uuid_lib
            import datetime
            
            # Buscar verificacion para el footer
            # SLICE 31.1: Now handled inside generate_from_html_file via db param
            # We pass existing verification UUID if we have it, or let the function resolve it.
            
            verification = db.query(models.PrescriptionVerification).filter(
                models.PrescriptionVerification.consultation_id == consultation.id
            ).first()
            
            uuid_str = verification.uuid if verification else ""
            
            return cls.generate_from_html_file(consultation, verification_uuid=uuid_str, db=db)

