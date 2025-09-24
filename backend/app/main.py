from fastapi import FastAPI
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