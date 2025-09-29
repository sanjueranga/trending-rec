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
            r'\b(?:hate|violence|discrimination)\b',
            r'\b(?:illegal|harmful|dangerous)\b',
            r'\b(?:adult|sexual|explicit)\b',
            r'\b(?:drugs|alcohol|gambling)\b',
        ]
        
        # Brand compliance keywords that should be encouraged
        self.positive_indicators = {
            'creative', 'engaging', 'innovative', 'educational', 
            'inspiring', 'professional', 'authentic', 'valuable'
        }
        
        # Profanity filter (basic implementation)
        self.profanity_words = {
            'damn', 'hell', 'crap', 'stupid', 'dumb', 'hate',
            # Add more as needed, this is a basic list
        }
        
        # Content quality indicators
        self.quality_indicators = {
            'min_length': 20,
            'max_length': 200,
            'min_words': 5,
            'max_words': 50
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
                logger.warning(f"Prohibited content detected in prompt: {prompt[:50]}...")
                return "Prompt contains inappropriate content"
        
        # Check for profanity
        words = prompt_clean.split()
        for word in words:
            if word in self.profanity_words:
                return "Please use appropriate language"
        
        # Check for potential prompt injection
        injection_patterns = [
            r'ignore.{0,20}instructions',
            r'system.{0,10}prompt',
            r'act.{0,10}as.{0,10}(?:admin|root|system)',
            r'pretend.{0,10}you.{0,10}are',
        ]
        
        for pattern in injection_patterns:
            if re.search(pattern, prompt_clean, re.IGNORECASE):
                logger.warning(f"Potential prompt injection detected: {prompt[:50]}...")
                return "Invalid prompt format"
        
        return None

    def filter_response(self, response: str) -> str:
        """
        Filter LLM response for compliance and quality.
        
        Args:
            response: Raw response from LLM
            
        Returns:
            str: Filtered and compliant response
        """
        if not response or not response.strip():
            return "I apologize, but I couldn't generate a valid response. Please try again."
        
        compliance_result = self._check_compliance(response)
        
        if not compliance_result.is_compliant:
            logger.warning(f"Non-compliant response filtered. Issues: {compliance_result.issues}")
            return "I apologize, but I need to generate a different response to ensure it meets our guidelines. Please try again."
        
        return compliance_result.filtered_content

    def _check_compliance(self, content: str) -> ComplianceResult:
        """
        Comprehensive compliance check for generated content.
        
        Args:
            content: Content to check
            
        Returns:
            ComplianceResult: Detailed compliance assessment
        """
        issues = []
        filtered_content = content.strip()
        
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
                    r'\b' + re.escape(word) + r'\b', 
                    '[filtered]', 
                    filtered_content, 
                    flags=re.IGNORECASE
                )
        
        # Quality checks
        word_count = len(content.split())
        if word_count < 10:
            issues.append("Content too brief for quality standards")
        
        # Check for completeness (should look like proper prompts)
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        valid_prompts = 0
        
        for line in lines:
            # Remove numbering
            clean_line = re.sub(r'^\d+\.\s*', '', line).strip()
            if len(clean_line) > 20 and not line.startswith('#'):
                valid_prompts += 1
        
        if valid_prompts < 3:
            issues.append("Insufficient valid prompts generated")
        
        # Brand compliance check (positive indicators)
        has_positive_indicators = any(
            indicator in content_lower 
            for indicator in self.positive_indicators
        )
        
        if not has_positive_indicators and len(content) > 100:
            # This is not a hard failure, just a quality concern
            pass
        
        is_compliant = len(issues) == 0
        
        return ComplianceResult(
            is_compliant=is_compliant,
            issues=issues,
            filtered_content=filtered_content
        )

    def validate_generated_prompts(self, prompts: List[str]) -> List[str]:
        """
        Validate and filter a list of generated prompts.
        
        Args:
            prompts: List of generated prompts
            
        Returns:
            List[str]: Filtered and validated prompts
        """
        validated_prompts = []
        
        for prompt in prompts:
            if not prompt or len(prompt.strip()) < 20:
                continue
                
            # Basic compliance check for each prompt
            compliance = self._check_compliance(prompt)
            if compliance.is_compliant:
                validated_prompts.append(compliance.filtered_content)
            else:
                logger.info(f"Filtered out non-compliant prompt: {prompt[:30]}...")
        
        # Ensure we have at least some prompts
        if len(validated_prompts) < 2:
            logger.warning("Too many prompts filtered out, may need to regenerate")
        
        return validated_prompts[:7]  # Limit to 7 prompts max