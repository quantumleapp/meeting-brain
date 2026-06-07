from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/meeting_brain"
    database_url_test: str = "postgresql://postgres:postgres@localhost:5432/meeting_brain_test"
    clova_api_key: str = ""
    clova_embed_url: str = ""
    clova_chat_url: str = ""
    clova_speech_key: str = ""
    clova_speech_invoke_url: str = ""
    embedding_dim: int = 1024


settings = Settings()
