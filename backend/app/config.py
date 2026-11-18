from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='../.env', extra='ignore')
    database_url: str = 'sqlite:///./demo.db'
    demo_mode: bool = True
    admin_api_key: str = ''
    llm_api_key: str = ''
    llm_base_url: str = 'https://api.openai.com/v1'
    llm_model: str = 'gpt-4.1-mini'
    telegram_bot_token: str = ''
    telegram_webhook_secret: str = ''
    telegram_manager_chat_id: str = ''
    public_base_url: str = ''


settings = Settings()
