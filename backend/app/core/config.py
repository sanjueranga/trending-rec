from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    GEMINI_API_KEY: str

    BASE_SYSTEM_PROMPT: str = """
    You are an advanced AI assistant specialized in creating high-impact content prompts. Your primary goal is to generate detailed, engaging, and actionable prompts that can be directly used by AI tools to produce high-quality content.
    For each request, you will:
    – Identify the target format i.e. the intention of the user (e.g., short-form videos, social posts, blogs, learning and more).
    – Provide enough detail, context, and creative direction so that the resulting content is compelling and on-brand.
    – Where relevant, offer multiple variations or angles.
"""

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
