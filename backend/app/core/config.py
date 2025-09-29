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
- Content: {content}

Task:
Generate 5–7 creative prompts that match the topic, intention, theme and content.
These prompts should:
- Be written as a full instruction, not just a short idea
- The prompts should explain what to create, in a way that is highly descriptive and specific
- The prompt must be relevant to the given intention only. For example, if the intention is "short-form video", the prompt should be suitable for a short-form video
- Be suitable for various content formats (e.g., short-form videos, social posts, blogs, ads and more)
- Be concise and engaging
- Work directly for content creation (e.g. videos, posts, blogs)
- Be phrased as instructions or hooks, not explanations
- Avoid greetings, hashtags, and meta-text
- Include specific details from the content to make prompts more relevant but do not copy the content verbatim
- If content is not provided, focus on the topic, intention, and theme to create relevant prompts
- If you cannot generate prompts based on the input, generate generic prompts related to the topic and intention.

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
