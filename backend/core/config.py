from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vitalinuage"
    # Defaults allow app to start in CI/CD or dev environments without full .env
    # Production MUST override these via Environment Variables
    DATABASE_URL: str = "sqlite:///./vitalinuage.db" 
    SECRET_KEY: str = "development_secret_key_change_me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    # CORS Configuration
    FRONTEND_URL: Optional[str] = None
    
    # Base allowed origins
    _base_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://vitalinuage.web.app",
        "https://vitalinuage.firebaseapp.com"
    ]

    @property
    def cors_origins(self) -> List[str]:
        """
        Returns the full list of allowed origins, including the configured FRONTEND_URL.
        """
        origins = self._base_origins.copy()
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        # Add env var provided origins if comma separated list exists? 
        # For now, sticking to the explicit requirement.
        return origins

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore" # Allow extra env vars

settings = Settings()
