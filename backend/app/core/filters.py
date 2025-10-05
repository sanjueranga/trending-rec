import re
import logging
from typing import Optional, List, Dict, Set
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ComplianceResult:
    is_compliant: bool
    issues: List[str]
    filtered_content: str


class ResponseFilter:
    def __init__(self):
        # Prohibited content patterns
        self.prohibited_patterns = [
            r"\b(?:hate|violence|discrimination)\b",
            r"\b(?:illegal|harmful|dangerous)\b",
            r"\b(?:adult|sexual|explicit)\b",
            r"\b(?:drugs|alcohol|gambling)\b",
        ]

        # Brand compliance keywords that should be encouraged
        self.positive_indicators = {
            "creative",
            "engaging",
            "innovative",
            "educational",
            "inspiring",
            "professional",
            "authentic",
            "valuable",
        }

        # Profanity filter (basic implementation)
        self.profanity_words = {
            "damn",
            "hell",
            "crap",
            "stupid",
            "dumb",
            "hate",
            # Add more as needed, this is a basic list
        }

        # Content quality indicators
        self.quality_indicators = {
            "min_length": 50,
            "max_length": 5000,  # Increased to allow 200+ word prompts
            "min_words": 20,  # Minimum 20 words for a basic prompt
            "max_words": 1000,  # Allow up to 1000 words for detailed prompts
        }

    def validate_prompt(self, prompt: str) -> Optional[str]:
        """
        Validate user input for compliance and security.

        Args:
            prompt: User's input prompt

        Returns:
            Optional[str]: Error message if validation fails, None if valid
        """
        if not prompt or not prompt.strip():
            return "Prompt cannot be empty"

        prompt_clean = prompt.strip().lower()

        # Length validation
        if len(prompt) < 2:
            return "Prompt too short (minimum 2 characters)"
        if len(prompt) > 500:
            return "Prompt too long (maximum 500 characters)"

        # Check for prohibited content
        for pattern in self.prohibited_patterns:
            if re.search(pattern, prompt_clean, re.IGNORECASE):
                logger.warning(
                    f"Prohibited content detected in prompt: {prompt[:50]}..."
                )
                return "Prompt contains inappropriate content"

        # Check for profanity
        words = prompt_clean.split()
        for word in words:
            if word in self.profanity_words:
                return "Please use appropriate language"

        # Check for potential prompt injection
        injection_patterns = [
            r"ignore.{0,20}instructions",
            r"system.{0,10}prompt",
            r"act.{0,10}as.{0,10}(?:admin|root|system)",
            r"pretend.{0,10}you.{0,10}are",
        ]

        for pattern in injection_patterns:
            if re.search(pattern, prompt_clean, re.IGNORECASE):
                logger.warning(f"Potential prompt injection detected: {prompt[:50]}...")
                return "Invalid prompt format"

        return None

    def filter_response(self, response: any) -> str:
        """
        Filter LLM response for compliance and quality.
        Raises ValueError if response is invalid to trigger automatic retry.

        Args:
            response: Raw response from LLM (can be str, list, or other types)

        Returns:
            str: Filtered and compliant response

        Raises:
            ValueError: If response is invalid or non-compliant (triggers retry)
        """
        try:
            # Handle different response types
            if isinstance(response, list):
                # If it's a list, join all elements
                response = "\n".join(str(item).strip() for item in response if item)
            elif isinstance(response, dict):
                # If it's a dict, try to extract text content
                response = str(response.get("text", response))
            else:
                # Convert any other type to string
                response = str(response)

            # Now process the string response
            if not response or not response.strip():
                logger.warning("Empty response received from LLM")
                raise ValueError("Empty response - retry needed")

            compliance_result = self._check_compliance(response)

            if not compliance_result.is_compliant:
                logger.warning(
                    f"Non-compliant response filtered. Issues: {compliance_result.issues}"
                )
                raise ValueError(
                    f"Non-compliant response - retry needed: {', '.join(compliance_result.issues)}"
                )

            return compliance_result.filtered_content

        except ValueError:
            # Re-raise ValueError to trigger retry
            raise
        except Exception as e:
            logger.error(f"Error filtering response: {str(e)}", exc_info=True)
            raise ValueError(f"Error processing response - retry needed: {str(e)}")

    def _check_compliance(self, content: any) -> ComplianceResult:
        """
        Comprehensive compliance check for generated content.

        Args:
            content: Content to check (can be any type)

        Returns:
            ComplianceResult: Detailed compliance assessment
        """
        try:
            # Convert content to string if it's not already
            if not isinstance(content, str):
                content = str(content)

            issues = []
            filtered_content = content.strip()

            # Basic validity check
            if not filtered_content:
                return ComplianceResult(
                    is_compliant=False,
                    issues=["Empty or invalid content"],
                    filtered_content="",
                )

            # Check for prohibited patterns
            for pattern in self.prohibited_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    issues.append(f"Contains prohibited content: {pattern}")

            # Check for profanity
            content_lower = content.lower()
            for word in self.profanity_words:
                if word in content_lower:
                    issues.append(f"Contains inappropriate language: {word}")
                    # Replace with alternatives
                    filtered_content = re.sub(
                        r"\b" + re.escape(word) + r"\b",
                        "[filtered]",
                        filtered_content,
                        flags=re.IGNORECASE,
                    )

            # Quality checks - More lenient for long descriptive prompts
            words = [w for w in content.split() if w.strip()]
            word_count = len(words)

            # Minimum word count check - should have at least some content
            if word_count < 10:
                issues.append("Content too brief for quality standards")

            # Check for completeness (should look like proper prompts)
            try:
                lines = [line.strip() for line in content.split("\n") if line.strip()]
                valid_prompts = 0

                for line in lines:
                    # Remove numbering
                    clean_line = re.sub(r"^\d+\.\s*", "", line).strip()
                    if len(clean_line) > 10:  # Reduced minimum length
                        valid_prompts += 1

                if not lines:  # If no valid lines found
                    # Try to split by other delimiters
                    alternative_lines = [
                        l.strip() for l in re.split(r"[;.]", content) if l.strip()
                    ]
                    if len(alternative_lines) > 0:
                        filtered_content = "\n".join(
                            f"{i+1}. {line}" for i, line in enumerate(alternative_lines)
                        )
                        valid_prompts = len(alternative_lines)

            except Exception as e:
                logger.warning(f"Error processing lines: {str(e)}")
                # Don't fail completely on line processing error
                valid_prompts = 1 if word_count >= 5 else 0

            # Only fail if there's absolutely no valid content
            # We need at least 1 prompt to pass through
            if valid_prompts < 1 and word_count < 20:
                issues.append("Insufficient valid content generated")

            # Brand compliance check (positive indicators)
            has_positive_indicators = any(
                indicator in content_lower for indicator in self.positive_indicators
            )

            if not has_positive_indicators and len(content) > 100:
                # This is not a hard failure, just a quality concern
                pass

            is_compliant = len(issues) == 0

            return ComplianceResult(
                is_compliant=is_compliant,
                issues=issues,
                filtered_content=filtered_content,
            )

        except Exception as e:
            logger.error(f"Error in compliance check: {str(e)}", exc_info=True)
            return ComplianceResult(
                is_compliant=False,
                issues=[f"Error processing content: {str(e)}"],
                filtered_content="",
            )

    def validate_generated_prompts(self, prompts: List[str]) -> List[str]:
        """
        Validate and filter a list of generated prompts.

        Args:
            prompts: List of generated prompts

        Returns:
            List[str]: Filtered and validated prompts (guaranteed at least 1 if input is not empty)
        """
        validated_prompts = []

        for prompt in prompts:
            # Accept prompts with at least 50 characters (very lenient for descriptive prompts)
            if not prompt or len(prompt.strip()) < 50:
                continue

            # Basic compliance check for each prompt
            compliance = self._check_compliance(prompt)
            if compliance.is_compliant:
                validated_prompts.append(compliance.filtered_content)
            else:
                # Still add the prompt if it's the only one we have
                if len(validated_prompts) == 0 and len(prompts) <= 2:
                    logger.warning(
                        f"Adding marginally compliant prompt to ensure minimum: {prompt[:50]}..."
                    )
                    validated_prompts.append(compliance.filtered_content)
                else:
                    logger.info(f"Filtered out non-compliant prompt: {prompt[:30]}...")

        # CRITICAL: Ensure we have at least 1 prompt - if all failed, include the best one
        if len(validated_prompts) == 0 and len(prompts) > 0:
            logger.warning(
                "All prompts filtered out, including the longest one to ensure minimum"
            )
            # Find the longest prompt as it's likely the most detailed
            longest_prompt = max(prompts, key=lambda p: len(p.strip()) if p else 0)
            if longest_prompt and len(longest_prompt.strip()) > 0:
                validated_prompts.append(longest_prompt.strip())

        return validated_prompts[:7]  # Limit to 7 prompts max
