import os
import re
from typing import List, Optional, Dict
import logging
import google.generativeai as genai
from dotenv import load_dotenv

from .base import LLMProvider
from ..config import get_settings

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")

        genai.configure(api_key=self.api_key)
        # Use gemini-2.0-flash-exp for better generation or gemini-1.5-pro for more reliable output
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

        # Configure generation settings for more consistent output
        self.generation_config = genai.types.GenerationConfig(
            temperature=0.9,  # High creativity for diverse prompts
            top_p=0.95,
            top_k=40,
            max_output_tokens=8192,  # Allow for long, detailed prompts
        )

    def _format_response(self, text: str) -> str:
        """
        Format the raw response by cleaning up markdown and extra formatting.
        Returns the cleaned text as a string (not parsed into list).

        Args:
            text: Raw response from LLM

        Returns:
            str: Cleaned response text
        """
        if not text:
            return ""

        # Remove markdown formatting but keep the structure
        text = re.sub(r"\*\*\*", "", text)  # Remove triple asterisks
        text = re.sub(r"\*\*", "", text)  # Remove double asterisks (bold)
        text = re.sub(r"\*", "", text)  # Remove single asterisks (italic)
        text = re.sub(r"```.*?\n", "", text)  # Remove code block markers
        text = re.sub(r"```", "", text)  # Remove closing code blocks

        # Remove any "Here are" or similar prefixes
        text = re.sub(
            r"^(Here are|Here\'s|Below are).*?:\s*\n",
            "",
            text,
            flags=re.IGNORECASE | re.MULTILINE,
        )

        # Clean up excessive whitespace
        text = re.sub(r"\n\s*\n\s*\n", "\n\n", text)  # Max 2 consecutive newlines

        return text.strip()

    async def generate(
        self, prompts: List[str], system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate a response using Gemini model.
        Returns the raw text response (not a list).

        Args:
            prompts: List of user prompts
            system_prompt: Optional system prompt to guide the model's behavior

        Returns:
            str: Generated response as text
        """
        # Combine system prompt and user prompts
        combined_prompt = ""
        if system_prompt:
            combined_prompt += f"{system_prompt}\n\n"

        combined_prompt += "\n".join(prompts)

        logger.debug(f"Sending prompt to Gemini (length: {len(combined_prompt)} chars)")

        try:
            response = await self.model.generate_content_async(
                combined_prompt, generation_config=self.generation_config
            )

            # Extract text from response parts
            text = ""
            if hasattr(response, "parts"):
                for part in response.parts:
                    if hasattr(part, "text"):
                        text += part.text
            elif hasattr(response, "text"):
                text = response.text
            else:
                # Fallback
                text = str(response)

            logger.info(f"Received response from Gemini (length: {len(text)} chars)")

            # Format and clean the response
            formatted_text = self._format_response(text)

            # Return as string, not list - the service will parse it
            return formatted_text

        except Exception as e:
            logger.error(f"Error generating response from Gemini: {str(e)}")
            raise Exception(f"Error generating response from Gemini: {str(e)}")
