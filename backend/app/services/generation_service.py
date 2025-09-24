from typing import List
from ..core.llm.base import LLMProvider
from ..core.llm.gemini_provider import GeminiProvider
from ..core.filters import ResponseFilter
from ..core.config import get_settings

class GenerationService:
    def __init__(self):
        self.llm_provider: LLMProvider = GeminiProvider()
        self.response_filter = ResponseFilter()
        self.settings = get_settings()
    
    async def generate_response(self, topic: str, intention: str, theme: str) -> str:
        """
        Generate a response based on the topic, intention, and theme.
        
        Args:
            topic: The subject area or domain
            intention: The user's goal or purpose
            theme: The style or approach desired
            
        Returns:
            str: Generated and filtered response
        """
        # Validate inputs
        for input_value, input_name in [(topic, "topic"), (intention, "intention"), (theme, "theme")]:
            error = self.response_filter.validate_prompt(input_value)
            if error:
                raise ValueError(f"Invalid {input_name}: {error}")
        
        # Combine base system prompt with formatted recommendation template
        recommendation_prompt = self.settings.RECOMMENDATION_PROMPT_TEMPLATE.format(
            topic=topic,
            intention=intention,
            theme=theme
        )
        
        system_prompt = f"{self.settings.BASE_SYSTEM_PROMPT}\n\n{recommendation_prompt}"
        
        # Generate response with combined prompts
        raw_response = await self.llm_provider.generate([system_prompt], None)
        
        # Filter response
        filtered_response = self.response_filter.filter_response(raw_response)
        
        return filtered_response
