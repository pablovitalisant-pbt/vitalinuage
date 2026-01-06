import resend
from jinja2 import Template
import os
from typing import Optional

class EmailService:
    """
    Servicio de envío de emails usando Resend.
    """
    
    @staticmethod
    def send_prescription_email(
        to_email: str,
        patient_name: str,
        doctor_name: str,
        pdf_url: str,
        issue_date: str
    ) -> bool:
        """
        Envía email con receta médica usando Resend.
        
        Args:
            to_email: Email del paciente
            patient_name: Nombre del paciente
            doctor_name: Nombre del médico
            pdf_url: URL pública del PDF
            issue_date: Fecha de emisión
        
        Returns:
            bool: True si se envió correctamente
        """
        try:
            api_key = os.getenv('RESEND_API_KEY')
            if not api_key:
                print("RESEND_API_KEY not configured")
                return False
                
            resend.api_key = api_key
            
            # Renderizar template
            template_path = os.path.join(
                os.path.dirname(__file__), 
                'email_templates', 
                'prescription_email.html'
            )
            
            # Verificar si existe el template, si no usar un fallback simple
            if os.path.exists(template_path):
                with open(template_path, 'r', encoding='utf-8') as f:
                    template = Template(f.read())
                
                html_content = template.render(
                    patient_name=patient_name,
                    doctor_name=doctor_name,
                    pdf_url=pdf_url,
                    issue_date=issue_date
                )
            else:
                # Fallback simple si no existe el archivo (para desarrollo)
                html_content = f"""
                <h1>Receta Médica</h1>
                <p>Hola {patient_name},</p>
                <p>El {doctor_name} le envía su receta médica.</p>
                <p><a href="{pdf_url}">Descargar Receta</a></p>
                """
            
            params = {
                "from": f"{os.getenv('EMAIL_FROM_NAME', 'Vitalinuage')} <{os.getenv('EMAIL_FROM_ADDRESS', 'noreply@vitalinuage.com')}>",
                "to": [to_email],
                "subject": f"Receta Médica - {doctor_name}",
                "html": html_content,
            }

            email = resend.Emails.send(params)
            return True
            
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
