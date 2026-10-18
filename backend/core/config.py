from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # These attributes will automatically be populated from the .env file
    PROJECT_NAME: str = "UniScope Backend"
    DATABASE_URI: str = ""
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # This tells Pydantic where to find the .env file and allows extra fields
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore extra environment variables that don't match defined fields
    )

# Global instance of the settings to import elsewhere
settings = Settings()