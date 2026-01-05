import os
import resend

class EmailService:
    @staticmethod
    def send_verification_email(to_email: str, token: str):
        """
        Sends a verification email using Resend.
        Also logs the link for debugging purposes.
        """
        # Determine Base URL
        frontend_url = os.getenv("FRONTEND_URL", "https://vitalinuage.web.app")
        verification_url = f"{frontend_url}/verify?token={token}"
        
        # Log for Debugging/Cloud Run Logs
        print(f"\n[EMAIL SERVICE] ---------------------------------------------------")
        print(f"[EMAIL SERVICE] To: {to_email}")
        print(f"[EMAIL SERVICE] Link: {verification_url}")
        print(f"[EMAIL SERVICE] ---------------------------------------------------\n")

        try:
            api_key = os.getenv("RESEND_API_KEY")
            if not api_key:
                print("[EMAIL SERVICE] WARNING: RESEND_API_KEY not set. Email not sent.")
                return False
                
            resend.api_key = api_key
            
            params = {
                "from": "Vitalinuage <onboarding@resend.dev>",
                "to": [to_email],
                "subject": "Verifica tu cuenta de Vitalinuage",
                "html": f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #1a365d;">Bienvenido a Vitalinuage</h1>
                    <p>Para activar tu cuenta y acceder al panel médico, por favor verifica tu correo electrónico.</p>
                    <a href="{verification_url}" style="display: inline-block; background-color: #2c5282; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Verificar mi cuenta
                    </a>
                    <p style="margin-top: 20px; font-size: 12px; color: #718096;">
                        Si el botón no funciona, copia y pega este enlace: {verification_url}
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            print(f"[EMAIL SERVICE] Email sent successfully: {email}")
            return True
            
        except Exception as e:
            print(f"[EMAIL SERVICE] ERROR sending email: {str(e)}")
            # Don't crash the app, just log error
            return False
