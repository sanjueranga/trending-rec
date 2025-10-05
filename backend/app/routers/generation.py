import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from ..services.generation_service import GenerationService
from ..core.config import get_settings
import fastapi_limiter.depends
from fastapi_limiter.depends import RateLimiter

logger = logging.getLogger(__name__)
router = APIRouter()


class GenerateRequest(BaseModel):
    topic: str = Field(
        ..., description="The subject area or domain for the recommendation"
    )
    intention: str = Field(
        ..., description="The user's goal or purpose for the recommendation"
    )
    theme: str = Field(
        ..., description="The style or approach desired for the recommendation"
    )
    content: str = Field(None, description="Content returned from n8n workflow, if any")


class GenerateResponse(BaseModel):
    success: bool = True
    prompts: List[str]
    count: int
    cached: bool = False
    metadata: Dict[str, Any] = {}


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None


# Dependency to get service instance
def get_generation_service() -> GenerationService:
    """Dependency to provide GenerationService instance."""
    return GenerationService()


@router.post(
    "/generate",
    response_model=GenerateResponse,
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def generate_prompts(
    request: GenerateRequest,
    service: GenerationService = Depends(get_generation_service),
):
    """
    Generate content prompts based on topic, intention, and theme.

    Args:
        request: Generation request parameters
        service: Injected generation service

    Returns:
        GenerateResponse: Generated prompts with metadata

    Raises:
        HTTPException: For various error conditions
    """
    logger.info(
        f"Generation request: topic='{request.topic}', intention='{request.intention}', theme='{request.theme}'"
    )

    try:
        # Pass content to the service
        prompts = await service.generate_response(
            topic=request.topic,
            intention=request.intention,
            theme=request.theme,
            content=request.content,
        )

        # Ensure we have a list of prompts
        if not isinstance(prompts, list):
            prompts = [str(prompts)] if prompts else []

        # CRITICAL: Validate we have at least 1 prompt
        if len(prompts) == 0:
            logger.error("Service returned empty prompt list")
            raise ValueError("Failed to generate any prompts. Please try again.")

        logger.info(f"Returning {len(prompts)} prompts to client")

        # Create response
        return GenerateResponse(
            prompts=prompts,
            count=len(prompts),
            metadata={
                "topic": request.topic,
                "intention": request.intention,
                "theme_length": len(request.theme),
            },
            cached=False,
        )

    except ValueError as e:
        # Input validation errors
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                error=str(e), details={"type": "validation_error"}
            ).dict(),
        )

    except Exception as e:
        # General errors (API failures, etc.)
        logger.error(f"Generation failed: {str(e)}")

        # Use a generic error message for production
        error_message = "An error occurred while generating content. Please try again."
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                error=error_message, details={"internal_error": str(e)}
            ).dict(),
        )
