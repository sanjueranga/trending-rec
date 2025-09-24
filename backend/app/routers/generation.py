from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any
from ..services.generation_service import GenerationService

router = APIRouter()

class GenerateRequest(BaseModel):
    topic: str = Field(..., description="The subject area or domain for the recommendation")
    intention: str = Field(..., description="The user's goal or purpose for the recommendation")
    theme: str = Field(..., description="The style or approach desired for the recommendation")

class GenerateResponse(BaseModel):
    response: list

class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
    details: Dict[str, Any] = None

@router.post("/generate", response_model=GenerateResponse)
async def generate_response(request: GenerateRequest):
    """
    Generate a recommendation based on the provided topic, intention, and theme.
    """
    try:
        service = GenerationService()
        response = await service.generate_response(
            topic=request.topic,
            intention=request.intention,
            theme=request.theme
        )
        return GenerateResponse(response=response)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                status="error",
                message=str(e)
            ).dict()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                status="error",
                message="Internal server error",
                details={"error": str(e)}
            ).dict()
        )
