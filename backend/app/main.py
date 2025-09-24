from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.routers import generation

app = FastAPI(
    title="Trending Recommendations API",
    description="API for generating recommendations using LLM",
    version="1.0.0"
)

# Include routers with /api prefix
app.include_router(generation.router, prefix="/api", tags=["generation"])

@app.get("/")
async def read_root():
    return {
        "status": "healthy",
        "message": "Welcome to the Trending Recommendations API"
    }

# Global exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = {}
    for error in exc.errors():
        if error["type"] == "value_error.missing":
            field = error["loc"][-1]
            errors[field] = f"The field '{field}' is required"
        else:
            field = error["loc"][-1]
            errors[field] = error["msg"]
    
    return JSONResponse(
        status_code=400,
        content={
            "status": "error",
            "message": "Validation error",
            "details": errors
        }
    )

# Global exception handler for other exceptions
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": str(exc.detail),
            "details": getattr(exc.detail, "details", None)
        }
    )

# Global exception handler for unexpected errors
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error",
            "details": {"error": str(exc)}
        }
    )