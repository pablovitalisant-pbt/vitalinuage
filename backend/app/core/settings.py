from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    allowed_origins: str = "*"
    is_testing: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
