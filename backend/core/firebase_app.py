
import firebase_admin
from firebase_admin import credentials
import logging
import os

logger = logging.getLogger(__name__)

def initialize_firebase():
    try:
        if not firebase_admin._apps:
            # En Cloud Run, las credenciales se detectan automáticamente si no se pasa nada
            # y se usa GOOGLE_APPLICATION_CREDENTIALS.
            # Para desarrollo local, si no hay credenciales, podría fallar o requerir json.
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        # No bloquemos el inicio, pero los endpoints protegidos fallarán
