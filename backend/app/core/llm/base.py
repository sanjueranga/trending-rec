from abc import ABC, abstractmethod
from typing import List, Optional

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompts: List[str], system_prompt: Optional[str] = None) -> str:
        """
        Generate a response based on the given prompts and system prompt.
        
        Args:
            prompts: List of user prompts
            system_prompt: Optional system prompt to guide the model's behavior
            
        Returns:
            str: Generated response
        """
        pass
