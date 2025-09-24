from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    
    BASE_SYSTEM_PROMPT: str = """You are an AI assistant that generates short, engaging, and actionable content prompts.
Your task is to create prompts that can be directly used with AI tools for different content formats
(such as short-form videos, social posts, blogs, or ads)."""

    RECOMMENDATION_PROMPT_TEMPLATE: str = """
Parameters:
- Topic: {topic}
- Intention: {intention}
- Theme: {theme}

Task:
Generate 5–7 creative prompts that match the topic, intention, and theme.
These prompts should:
- Be written as a full instruction, not just a short idea
- Be concise and engaging
- Work directly for content creation (e.g. videos, posts, blogs)
- Be phrased as instructions or hooks, not explanations
- Avoid greetings, hashtags, and meta-text

Output Format:
Return the list as plain text in this style:
1. [Prompt text]
2. [Prompt text]
3. [Prompt text]
"""

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
