import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from ..services.generation_service import GenerationService
from ..core.config import get_settings

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


@router.post("/generate", response_model=GenerateResponse)
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
        service = GenerationService()
        # Pass content to the service if needed in the future
        response = await service.generate_response(
            topic=request.topic, intention=request.intention, theme=request.theme
        )
     
        # Create response assuming response is a list of prompts
        return GenerateResponse(
            prompts=response if isinstance(response, list) else [],
            count=len(response) if isinstance(response, list) else 0,
            metadata={},
            cached=False
        )
        
    except ValueError as e:
        # Input validation errors
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=400, 
            detail=ErrorResponse(
                error=str(e),
                details={"type": "validation_error"}
            ).dict()
        )

    except Exception as e:
        # General errors (API failures, etc.)
        logger.error(f"Generation failed: {str(e)}")

        # Use a generic error message for production
        error_message = "An error occurred while generating content. Please try again."
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                error=error_message,
                details={"internal_error": str(e)}
            ).dict()
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for the generation service."""
    return {"status": "healthy", "service": "prompt_generation"}


@router.post("/validate")
async def validate_request(request: GenerateRequest):
    """
    Validate a generation request without actually generating content.
    Useful for form validation on the frontend.
    """
    try:
        service = get_generation_service()
        service._validate_inputs(request.topic, request.intention, request.theme)

        return {"valid": True, "message": "Request parameters are valid"}
    except ValueError as e:
        return {"valid": False, "message": str(e)}


@router.get("/stats")
async def get_service_stats(
    service: GenerationService = Depends(get_generation_service),
):
    """Get service statistics including cache info."""
    cache_stats = service.get_cache_stats()

    return {
        "service": "prompt_generation",
        "cache_stats": cache_stats,
        "supported_intentions": ["video", "app", "learning"],
    }


@router.delete("/cache")
async def clear_cache(service: GenerationService = Depends(get_generation_service)):
    """Clear the service cache."""
    service.clear_cache()
    return {"success": True, "message": "Cache cleared successfully"}
