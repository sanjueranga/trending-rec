from typing import Optional, List, Tuple, Dict
import re
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ThemeCompliance:
    theme: str
    relevance_score: float
    theme_mentions: int
    thematic_coherence: bool
    suggestions: List[str]

class ResponseFilter:
    def __init__(self):
        # Theme relevance patterns
        self.theme_indicators = {
            'high_impact': [
                r'\b(?:focus on|centered around|theme of|exploring|delving into)\b',
                r'\b(?:incorporat(?:e|ing)|embrac(?:e|ing)|weav(?:e|ing) in)\b',
                r'\b(?:through the lens of|in the style of|with a focus on)\b'
            ],
            'medium_impact': [
                r'\b(?:about|regarding|concerning)\b',
                r'\b(?:related to|connected with|associated with)\b'
            ]
        }
        
        # Content quality patterns
        self.quality_indicators = {
            'completeness': [
                r'\b(?:step by step|comprehensive|detailed|thorough)\b',
                r'\b(?:structure|outline|framework|blueprint)\b'
            ],
            'actionability': [
                r'\b(?:create|make|build|develop|produce)\b',
                r'\b(?:include|incorporate|add|feature)\b',
                r'\b(?:ensure|make sure|remember to)\b'
            ]
        }

    def filter_response(self, response: str, theme: str = None) -> str:
        """
        Enhanced response filtering with theme relevance checking.
        """
        if not response or not response.strip():
            return "I apologize, but I couldn't generate a valid response."

        filtered_response = response.strip()
        
        # Basic content safety check
        safety_issues = self._check_content_safety(filtered_response)
        if safety_issues:
            logger.warning(f"Content safety issues detected: {safety_issues}")
            return "I need to provide a different response that meets our content guidelines."
        
        # Theme relevance enhancement (if theme provided)
        if theme:
            theme_compliance = self._check_theme_compliance(filtered_response, theme)
            
            if theme_compliance.relevance_score < 0.3:
                logger.warning(f"Theme relevance too low: {theme_compliance.relevance_score}")
                # Try to enhance the response with theme
                enhanced_response = self._enhance_theme_relevance(filtered_response, theme)
                if enhanced_response:
                    filtered_response = enhanced_response
            
            # Log theme compliance for monitoring
            logger.info(f"Theme '{theme}' compliance: {theme_compliance.relevance_score:.2f}")
        
        # Quality enhancement
        quality_enhanced = self._enhance_response_quality(filtered_response)
        
        return quality_enhanced

    def validate_prompt(self, prompt: str, intention: str = None) -> Optional[str]:
        """
        Enhanced prompt validation with intention awareness.
        """
        if not prompt or not prompt.strip():
            return "Prompt cannot be empty"
        
        prompt_clean = prompt.strip()
        
        # Length validation
        if len(prompt_clean) < 3:
            return "Prompt too short (minimum 3 characters)"
        
        if len(prompt_clean) > 1000:
            return "Prompt too long (maximum 1000 characters)"
        
        # Content safety validation
        safety_issue = self._check_prompt_safety(prompt_clean)
        if safety_issue:
            return safety_issue
        
        # Intention-aware validation
        if intention:
            relevance_issue = self._check_intention_relevance(prompt_clean, intention)
            if relevance_issue:
                return relevance_issue
        
        return None

    def _check_theme_compliance(self, response: str, theme: str) -> ThemeCompliance:
        """
        Analyze how well the response incorporates the given theme.
        """
        response_lower = response.lower()
        theme_lower = theme.lower()
        
        # Count direct theme mentions
        theme_mentions = len(re.findall(r'\b' + re.escape(theme_lower) + r'\b', response_lower))
        
        # Check for thematic indicators
        high_impact_matches = 0
        for pattern in self.theme_indicators['high_impact']:
            high_impact_matches += len(re.findall(pattern, response_lower))
        
        medium_impact_matches = 0
        for pattern in self.theme_indicators['medium_impact']:
            medium_impact_matches += len(re.findall(pattern, response_lower))
        
        # Calculate relevance score (0-1)
        word_count = len(response.split())
        theme_score = (
            (theme_mentions * 0.4) +
            (high_impact_matches * 0.4) +
            (medium_impact_matches * 0.2)
        ) / max(1, word_count / 100)  # Normalize by length
        
        # Cap the score at 1.0
        theme_score = min(1.0, theme_score)
        
        # Check thematic coherence
        thematic_coherence = theme_mentions > 0 or high_impact_matches > 0
        
        # Generate suggestions for improvement
        suggestions = []
        if theme_score < 0.5:
            if theme_mentions == 0:
                suggestions.append(f"Explicitly mention the theme '{theme}'")
            if high_impact_matches == 0:
                suggestions.append("Use stronger thematic language like 'focus on' or 'centered around'")
        
        return ThemeCompliance(
            theme=theme,
            relevance_score=theme_score,
            theme_mentions=theme_mentions,
            thematic_coherence=thematic_coherence,
            suggestions=suggestions
        )

    def _enhance_theme_relevance(self, response: str, theme: str) -> Optional[str]:
        """
        Attempt to enhance theme relevance in the response.
        """
        lines = response.split('\n')
        enhanced_lines = []
        
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            
            # Skip if line is too short or already numbered
            if len(line_stripped) < 10 or re.match(r'^\d+\.', line_stripped):
                enhanced_lines.append(line)
                continue
            
            # Check if this line lacks theme context
            theme_compliance = self._check_theme_compliance(line_stripped, theme)
            
            if theme_compliance.relevance_score < 0.3:
                # Enhance the line with theme context
                enhanced_line = self._apply_theme_context(line_stripped, theme)
                enhanced_lines.append(enhanced_line)
            else:
                enhanced_lines.append(line)
        
        enhanced_response = '\n'.join(enhanced_lines)
        
        # Verify enhancement actually improved relevance
        original_score = self._check_theme_compliance(response, theme).relevance_score
        enhanced_score = self._check_theme_compliance(enhanced_response, theme).relevance_score
        
        if enhanced_score > original_score:
            return enhanced_response
        else:
            return None

    def _apply_theme_context(self, text: str, theme: str) -> str:
        """
        Apply theme context to a piece of text.
        """
        # Simple enhancement strategies
        enhancements = [
            f"With a focus on {theme}, {text[0].lower()}{text[1:]}",
            f"Exploring {theme}, {text[0].lower()}{text[1:]}",
            f"In the context of {theme}, {text[0].lower()}{text[1:]}",
            f"Centered around {theme}, {text}"
        ]
        
        # Choose the enhancement that flows best
        for enhancement in enhancements:
            if len(enhancement) < len(text) * 2:  # Avoid making it too long
                return enhancement
        
        return text  # Fallback to original

    def _enhance_response_quality(self, response: str) -> str:
        """
        Enhance the overall quality of the response.
        """
        # Check for common quality issues
        lines = [line.strip() for line in response.split('\n') if line.strip()]
        
        if len(lines) < 2:
            # Single block of text - try to structure it
            sentences = re.split(r'[.!?]+', response)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            if len(sentences) > 3:
                # Convert to numbered list
                structured = []
                for i, sentence in enumerate(sentences[:7], 1):  # Max 7 items
                    if len(sentence) > 10:  # Meaningful sentence
                        structured.append(f"{i}. {sentence}")
                if structured:
                    return '\n'.join(structured)
        
        return response

    def _check_content_safety(self, content: str) -> List[str]:
        """
        Basic content safety checks.
        """
        issues = []
        content_lower = content.lower()
        
        # Basic prohibited content patterns
        prohibited_patterns = [
            (r'\b(?:hate|violence|harm)\b', 'inappropriate content'),
            (r'\b(?:illegal|unethical)\b', 'questionable legality'),
        ]
        
        for pattern, issue in prohibited_patterns:
            if re.search(pattern, content_lower):
                issues.append(issue)
        
        return issues

    def _check_prompt_safety(self, prompt: str) -> Optional[str]:
        """
        Enhanced prompt safety validation.
        """
        prompt_lower = prompt.lower()
        
        # Injection attempt patterns
        injection_patterns = [
            r'ignore.*instruction',
            r'system.*prompt',
            r'previous.*instruction',
            r'act as',
            r'role play',
        ]
        
        for pattern in injection_patterns:
            if re.search(pattern, prompt_lower, re.IGNORECASE):
                return "Invalid prompt format detected"
        
        return None

    def _check_intention_relevance(self, prompt: str, intention: str) -> Optional[str]:
        """
        Check if prompt is relevant to the stated intention.
        """
        # Simple keyword-based relevance check
        intention_keywords = {
            'educational': ['learn', 'teach', 'educate', 'tutorial', 'guide'],
            'marketing': ['promote', 'market', 'sell', 'advertise', 'brand'],
            'entertainment': ['entertain', 'fun', 'enjoy', 'story', 'creative'],
        }
        
        prompt_lower = prompt.lower()
        intention_lower = intention.lower()
        
        for intent_category, keywords in intention_keywords.items():
            if intent_category in intention_lower:
                # Check if prompt contains relevant keywords
                relevant_keywords = [kw for kw in keywords if kw in prompt_lower]
                if not relevant_keywords:
                    return f"Prompt doesn't seem relevant for {intent_category} content"
                break
        
        return None