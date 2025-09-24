from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    
    # Base system prompt that sets the AI's behavior and constraints
    BASE_SYSTEM_PROMPT: str = """You are an AI assistant specializing in generating trending recommendations. Your responses should be:
    1. Professional and courteous
    2. Accurate and up-to-date
    3. Free from harmful, unethical, or inappropriate content
    4. Aligned with our brand values of trust, innovation, and user empowerment
    5. Focused on providing valuable, actionable recommendations"""
    
    # Template for combining user inputs with system prompt
    RECOMMENDATION_PROMPT_TEMPLATE: str = """
    Based on the following parameters:
    Topic: {topic} - The subject area or domain
    Intention: {intention} - The user's goal or purpose
    Theme: {theme} - The style or approach desired
    
    Please provide relevant and trending recommendations that:
    - Are specifically tailored to the topic
    - Help achieve the stated intention
    - Match the specified theme
    - Include current trends and best practices
    - Are practical and actionable
    """
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
