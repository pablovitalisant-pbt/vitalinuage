from unittest.mock import patch, MagicMock
from backend.services.email_service import EmailService
from backend.auth import register
from backend import schemas
import pytest

def test_send_verification_email_success():
    """
    Verifies that EmailService.send_verification_email calls Resend API correctly.
    """
    with patch("backend.services.email_service.resend.Emails.send") as mock_send, \
         patch("backend.services.email_service.os.getenv") as mock_env:
        
        # Configure Mocks
        def getenv_side_effect(key, default=None):
            if key == "RESEND_API_KEY":
                return "re_123456789"
            return default
            
        mock_env.side_effect = getenv_side_effect
        
        # Arrange
        to_email = "test@example.com"
        token = "test-uuid-token"
        name = "Dr. Test"
        
        # Act
        result = EmailService.send_verification_email(to_email, token, name)
        
        # Assert
        assert result is True
        mock_send.assert_called_once()
        args = mock_send.call_args[0][0]
        assert args["to"] == [to_email]
        assert "verify?token=test-uuid-token" in args["html"]

def test_send_verification_email_no_key():
    """
    Verifies graceful failure when API key is missing.
    """
    with patch("backend.services.email_service.os.getenv") as mock_env:
        # Simulate missing API key
        mock_env.return_value = None
        
        result = EmailService.send_verification_email("a@b.com", "t", "n")
        assert result is False

if __name__ == "__main__":
    # Manually run if executed directly
    try:
        test_send_verification_email_success()
        print("PASS: Email Service Logic")
        test_send_verification_email_no_key()
        print("PASS: Missing Key Handling")
    except Exception as e:
        print(f"FAIL: {e}")
