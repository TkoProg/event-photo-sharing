from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./flashback.db"

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    backend_base_url: str = "http://127.0.0.1:8000"
    upload_folder: str = "app/uploads"

    class Config:
        env_file = ".env"


settings = Settings()
