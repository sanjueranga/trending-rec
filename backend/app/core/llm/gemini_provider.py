import os
from typing import List, Optional
import google.generativeai as genai
from dotenv import load_dotenv

from .base import LLMProvider
from ..config import get_settings

class GeminiProvider(LLMProvider):
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
    async def generate(self, prompts: List[str], system_prompt: Optional[str] = None) -> str:
        """
        Generate a response using Gemini model.
        
        Args:
            prompts: List of user prompts
            system_prompt: Optional system prompt to guide the model's behavior
            
        Returns:
            str: Generated response
        """
        # Combine system prompt and user prompts
        combined_prompt = ""
        if system_prompt:
            combined_prompt += f"{system_prompt}\n\n"
        
        combined_prompt += "\n".join(prompts)
        
        try:
            response = await self.model.generate_content_async(combined_prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Error generating response from Gemini: {str(e)}")
