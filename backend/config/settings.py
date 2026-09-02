from pathlib import Path
from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    anthropic_api_key: str
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str
    chroma_db_path: str = str(Path(__file__).resolve().parent.parent.parent / "chroma_db")
    frontend_url: str = "http://localhost:5173"
    environment: str = "development"

    class Config:
        env_file = str(_ENV_FILE)


settings = Settings()
