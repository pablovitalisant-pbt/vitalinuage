from reportlab.pdfgen import canvas
from reportlab.lib.units import mm as reportlab_mm
from reportlab.lib.pagesizes import A5
from weasyprint import HTML
from sqlalchemy.orm import Session
from typing import Optional
from backend from backend import models
import tempfile
import os


class PDFService:
    """
    Servicio de generación de PDFs con soporte para coordenadas personalizadas.
    Estrategia híbrida: ReportLab para coordenadas exactas, WeasyPrint para templates.
    """
    
    @staticmethod
    def mm_to_points(millimeters: float) -> float:
        """
        Convierte milímetros a puntos PDF.
        1mm = 2.83465 points (estándar PDF)
        
        Args:
            millimeters: Valor en milímetros
            
        Returns:
            float: Valor en puntos PDF
        """
        return millimeters * 2.83465
    
    @staticmethod
    def get_active_map(doctor_email: str, db: Session) -> Optional[models.PrescriptionMap]:
        """
        Obtiene el mapa de coordenadas activo del médico.
        
        Args:
            doctor_email: Email del médico
            db: Sesión de base de datos
            
        Returns:
            PrescriptionMap si existe y está activo, None en caso contrario
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
            consultation: Consulta clínica
            field_key: Clave del campo ('patient_name', 'diagnosis', etc.)
            
        Returns:
            str: Valor del campo o cadena vacía si no existe
        """
        FIELD_MAPPING = {
            'patient_name': lambda c: f"{c.patient.nombre} {c.patient.apellido_paterno}",
            'patient_dni': lambda c: c.patient.dni or "N/A",
            'date': lambda c: c.created_at.strftime('%d/%m/%Y') if c.created_at else "",
            'diagnosis': lambda c: c.diagnosis or "",
            'treatment': lambda c: c.treatment or "",
            'doctor_signature': lambda c: "Firma y Sello Médico"
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
            consultation: Datos de la consulta clínica
            prescription_map: Configuración de coordenadas
            output_path: Ruta temporal para el PDF
            db: Sesión de base de datos (para crear verificaciones QR)
        
        Returns:
            bytes: Contenido del PDF generado
        """
        from reportlab.lib.utils import ImageReader
        from services.qr_service import generate_qr_image
        import uuid as uuid_lib
        import datetime
        
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
                
                # Generar registro de verificación
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
                    y_pt - size_pt,  # Ajuste para alineación
                    width=size_pt,
                    height=size_pt,
                    preserveAspectRatio=True
                )
            else:
                # Lógica existente para campos de texto
                field_value = cls.extract_field_value(consultation, field_config['field_key'])
                
                # Convertir coordenadas mm → puntos
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
        Fallback para médicos sin mapa configurado.
        
        Args:
            consultation: Datos de la consulta clínica
            template_id: ID del template ('minimal', 'modern', 'classic')
        
        Returns:
            bytes: Contenido del PDF generado
        """
        from pdf_templates import MINIMAL_TEMPLATE, MODERN_TEMPLATE, CLASSIC_TEMPLATE
        from jinja2 import Template
        
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
            address = "Consultorio Médico"
        
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
    
    @classmethod
    def generate_prescription_pdf(
        cls,
        consultation: models.ClinicalConsultation,
        doctor_email: str,
        db: Session
    ) -> bytes:
        """
        Método principal: decide qué estrategia usar (coordenadas vs template).
        
        Args:
            consultation: Datos de la consulta clínica
            doctor_email: Email del médico autenticado
            db: Sesión de base de datos
        
        Returns:
            bytes: Contenido del PDF generado
        """
        # 1. Buscar mapa activo del médico
        prescription_map = cls.get_active_map(doctor_email, db)
        
        # 2. Decidir estrategia
        if prescription_map:
            # Usar coordenadas personalizadas (ReportLab)
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
                pdf_bytes = cls.generate_with_coordinates(
                    consultation, 
                    prescription_map, 
                    tmp.name,
                    db=db  # Pass db session for QR verification
                )
                # Cleanup temp file
                try:
                    os.unlink(tmp.name)
                except:
                    pass
            return pdf_bytes
        else:
            # Usar template estándar (WeasyPrint)
            return cls.generate_with_template(consultation, template_id="modern")
