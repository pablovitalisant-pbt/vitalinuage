import resend
from jinja2 import Template
import os
import logging
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

    @staticmethod
    def send_verification_email(
        to_email: str,
        verification_token: str,
        professional_name: str
    ) -> bool:
        """
        Envía email de verificación de cuenta.
        
        Args:
            to_email: Email del nuevo usuario
            verification_token: Token UUID generado
            professional_name: Nombre del profesional
            
        Returns:
            bool: True si se envió correctamente
        """
        try:
            api_key = os.getenv('RESEND_API_KEY')
            if not api_key:
                # Log warning in production, but don't crash
                logging.getLogger(__name__).warning("RESEND_API_KEY not configured. Email skipped.")
                return False
                
            resend.api_key = api_key
            
            # Determine Base URL (Prod vs Local)
            # In a real scenario, this comes from env var, defaulting to localhost for safety
            base_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            verify_url = f"{base_url}/verify?token={verification_token}"
            
            # Simple Template for Verification
            html_content = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1>Bienvenido a Vitalinuage</h1>
                <p>Estimado/a {professional_name},</p>
                <p>Gracias por registrarse. Para activar su cuenta, por favor verifique su correo electrónico haciendo clic en el siguiente enlace:</p>
                <div style="margin: 20px 0;">
                    <a href="{verify_url}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verificar Email</a>
                </div>
                <p>O copie y pegue este enlace en su navegador:</p>
                <p><small>{verify_url}</small></p>
                <p>Este enlace expirará en 24 horas.</p>
            </div>
            """
            
            params = {
                "from": f"{os.getenv('EMAIL_FROM_NAME', 'Vitalinuage Security')} <{os.getenv('EMAIL_FROM_ADDRESS', 'security@vitalinuage.com')}>",
                "to": [to_email],
                "subject": "Verifique su cuenta Vitalinuage",
                "html": html_content,
            }

            resend.Emails.send(params)
            return True
            
        except Exception as e:
            logging.getLogger(__name__).error(f"Error sending verification email: {e}")
            return False
