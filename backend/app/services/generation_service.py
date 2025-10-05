from typing import List
import logging
from ..core.llm.base import LLMProvider
from ..core.llm.gemini_provider import GeminiProvider
from ..core.filters import ResponseFilter
from ..core.config import get_settings

logger = logging.getLogger(__name__)


class GenerationService:
    def __init__(self):
        self.llm_provider: LLMProvider = GeminiProvider()
        self.response_filter = ResponseFilter()
        self.settings = get_settings()
        self.max_retries = 3  # Maximum retry attempts

    async def generate_response(
        self, topic: str, intention: str, theme: str, content: str = None
    ) -> List[str]:
        """
        Generate a response based on the topic, intention, theme, and (optionally) content.
        GUARANTEED to return at least 1 prompt.

        Args:
            topic: The subject area or domain
            intention: The user's goal or purpose
            theme: The style or approach desired
            content: Content returned from n8n workflow, if any (optional)
        Returns:
            List[str]: List of generated prompts (minimum 1, maximum 7)
        """
        # Validate required inputs
        for input_value, input_name in [
            (topic, "topic"),
            (intention, "intention"),
            (theme, "theme"),
        ]:
            error = self.response_filter.validate_prompt(input_value)
            if error:
                raise ValueError(f"Invalid {input_name}: {error}")

        # Only validate content if it is provided (not None and not empty string)
        if content is not None and str(content).strip() != "":
            error = self.response_filter.validate_prompt(content)
            if error:
                raise ValueError(f"Invalid content: {error}")

        # Set content to empty string if None to avoid "None" in prompt
        if content is None:
            content = ""

        # Try generating prompts with retry logic
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Generation attempt {attempt + 1}/{self.max_retries}")

                # Combine base system prompt with formatted recommendation template
                recommendation_prompt = (
                    self.settings.RECOMMENDATION_PROMPT_TEMPLATE.format(
                        topic=topic, intention=intention, theme=theme, content=content
                    )
                )

                system_prompt = (
                    f"{self.settings.BASE_SYSTEM_PROMPT}\n\n{recommendation_prompt}"
                )

                # Generate response with combined prompts
                raw_response = await self.llm_provider.generate([system_prompt], None)

                logger.info(f"Raw response type: {type(raw_response)}")
                logger.debug(f"Raw response preview: {str(raw_response)[:200]}...")

                # Filter response
                filtered_response = self.response_filter.filter_response(raw_response)

                logger.info(f"Filtered response preview: {filtered_response[:200]}...")

                # Parse prompts from response
                prompts = self._parse_prompts(filtered_response)

                # Validate prompts
                validated_prompts = self.response_filter.validate_generated_prompts(
                    prompts
                )

                # CRITICAL: Ensure we have at least 1 prompt
                if len(validated_prompts) > 0:
                    logger.info(
                        f"Successfully generated {len(validated_prompts)} prompts"
                    )
                    return validated_prompts
                else:
                    logger.warning(
                        f"Attempt {attempt + 1}: No valid prompts generated, retrying..."
                    )

            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt == self.max_retries - 1:
                    raise

        # FALLBACK: If all retries fail, generate a basic prompt
        logger.error("All retry attempts failed, generating fallback prompt")
        fallback_prompt = self._generate_fallback_prompt(
            topic, intention, theme, content
        )
        return [fallback_prompt]

    def _parse_prompts(self, response: str) -> List[str]:
        """
        Parse prompts from the LLM response.

        Args:
            response: Filtered response string

        Returns:
            List[str]: Parsed prompts
        """
        if not response or not response.strip():
            return []

        # Split by newlines and clean up
        lines = [line.strip() for line in response.split("\n") if line.strip()]

        prompts = []
        current_prompt = []

        for line in lines:
            # Check if line starts with a number (new prompt)
            if line and line[0].isdigit() and "." in line[:5]:
                # Save previous prompt if exists
                if current_prompt:
                    prompt_text = " ".join(current_prompt)
                    # Remove leading numbers and dots
                    prompt_text = prompt_text.lstrip("0123456789. ").strip()
                    if prompt_text:
                        prompts.append(prompt_text)
                    current_prompt = []

                # Start new prompt (remove numbering)
                clean_line = line.lstrip("0123456789. ").strip()
                if clean_line:
                    current_prompt.append(clean_line)
            else:
                # Continue current prompt
                if line:
                    current_prompt.append(line)

        # Add the last prompt
        if current_prompt:
            prompt_text = " ".join(current_prompt)
            prompt_text = prompt_text.lstrip("0123456789. ").strip()
            if prompt_text:
                prompts.append(prompt_text)

        return prompts

    def _generate_fallback_prompt(
        self, topic: str, intention: str, theme: str, content: str
    ) -> str:
        """
        Generate a basic fallback prompt if all else fails.

        Args:
            topic: The topic
            intention: The intention
            theme: The theme
            content: The content

        Returns:
            str: A basic but valid prompt
        """
        fallback = f"""Create compelling {intention.lower()} content focused on {topic}. 
        
Core Theme: {theme}

Detailed Instructions:
Develop comprehensive {intention.lower()} that explores the theme "{theme}" within the context of {topic}. Your content should be engaging, informative, and tailored specifically for {intention.lower()}.

Key Requirements:
1. Clearly communicate the central theme throughout the content
2. Provide specific examples and actionable insights related to {topic}
3. Structure the content in a way that is appropriate for {intention.lower()}
4. Maintain an engaging tone that resonates with the target audience
5. Include relevant details and context to make the content valuable

Content Structure:
- Begin with a strong hook that captures attention
- Develop the main ideas with supporting details and examples
- Incorporate insights related to: {content[:100] if content else 'the given theme'}
- Conclude with a clear takeaway or call-to-action

Style Guidelines:
- Keep the tone professional yet accessible
- Use clear, concise language
- Ensure the content aligns with best practices for {intention.lower()}
- Make it visually or narratively engaging as appropriate for the format

Deliverable: High-quality {intention.lower()} content that effectively communicates the theme while providing value to the audience."""

        return fallback.strip()
