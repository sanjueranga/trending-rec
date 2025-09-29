import os
import re
from typing import List, Optional, Dict
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
        self.model = genai.GenerativeModel('gemini-2.0-flash')
    
    def _format_response(self, text: str) -> List[str]:
        """
        Format the raw response into a clean list of prompts.
        
        Args:
            text: Raw response from LLM
            
        Returns:
            List[str]: List of clean prompts
        """
        # Remove any markdown formatting
        text = re.sub(r'\*\*|\*', '', text)
        
        # Split into lines and clean up
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        prompts = []
        for line in lines:
            # Skip empty lines, hashtags, or explanatory text
            if not line or line.startswith('#') or ':' in line or 'example' in line.lower():
                continue
            
            # Remove leading numbers and dots
            cleaned_line = re.sub(r'^\d+\.\s*', '', line)
            
            if cleaned_line:
                prompts.append(cleaned_line)
        
        return prompts
        
    async def generate(self, prompts: List[str], system_prompt: Optional[str] = None) -> str:
        """
        Generate a response using Gemini model.
        
        Args:
            prompts: List of user prompts
            system_prompt: Optional system prompt to guide the model's behavior
            
        Returns:
            str: Generated response as formatted JSON
        """
        # Combine system prompt and user prompts
        combined_prompt = ""
        if system_prompt:
            combined_prompt += f"{system_prompt}\n\n"
        
        combined_prompt += "\n".join(prompts)
        
        try:
            response = await self.model.generate_content_async(combined_prompt)
            
            # Extract text from response parts
            text = ""
            for part in response.parts:
                text += part.text
            
            # Format the response
            prompts = self._format_response(text)
            return prompts
            
        except Exception as e:
            raise Exception(f"Error generating response from Gemini: {str(e)}")
