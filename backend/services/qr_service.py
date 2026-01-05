import qrcode
from io import BytesIO
from PIL import Image


def generate_qr_image(url: str, size_mm: float = 25.0) -> BytesIO:
    """
    Genera imagen QR en memoria.
    
    Args:
        url: URL de verificación
        size_mm: Tamaño del QR en milímetros (no usado actualmente, para compatibilidad)
    
    Returns:
        BytesIO: Imagen PNG del QR
    """
    qr = qrcode.QRCode(
        version=1,  # Tamaño automático
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=1,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convertir a bytes
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return buffer
