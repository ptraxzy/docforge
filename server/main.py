#!/usr/bin/env python3
"""
DocForge Server - AI-Powered Documentation Generator

Usage:
    # With .env file
    uvicorn main:app --host 0.0.0.0 --port 8000
    
    # With environment variables
    AI_BASE_URL=http://localhost:11434/v1 AI_MODEL=llama3 uvicorn main:app
"""

import os
import sys
import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager

# Add the server directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env file if exists
load_dotenv()

from config import config, validate_config

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("docforge")

from routes.generate import router as generate_router
from routes.repo import router as repo_router
from routes.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    validate_config()
    logger.info("DocForge server started successfully")
    yield
    # Shutdown
    logger.info("DocForge server shutting down")


# Create FastAPI app
app = FastAPI(
    title="DocForge Server",
    description="AI-Powered Documentation Generator - Open Source",
    version="0.1.0",
    lifespan=lifespan,
)

# In-memory rate limiting state
rate_limit_records: dict[str, list[float]] = defaultdict(list)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """IP-based rate limiting for AI generation endpoints."""
    if request.url.path in ["/generate", "/generate-from-repo"]:
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Keep only timestamps from the last 60 seconds
        rate_limit_records[client_ip] = [
            t for t in rate_limit_records[client_ip] if now - t < 60
        ]
        
        limit = config.RATE_LIMIT_PER_MINUTE
        if len(rate_limit_records[client_ip]) >= limit:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": "Too Many Requests",
                    "detail": f"Rate limit exceeded. Maximum {limit} requests per minute."
                }
            )
        
        rate_limit_records[client_ip].append(now)
        
    response = await call_next(request)
    return response


# CORS middleware
cors_origins = (
    config.CORS_ORIGINS.split(",")
    if config.CORS_ORIGINS != "*"
    else ["*"]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(generate_router, tags=["Generate"])
app.include_router(repo_router, tags=["Repository"])
app.include_router(health_router, tags=["Health"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "DocForge Server",
        "version": "0.1.0",
        "description": "AI-Powered Documentation Generator",
        "endpoints": {
            "POST /generate": "Generate docs from code files",
            "POST /generate-from-repo": "Generate docs from git repository",
            "GET /health": "Health check with AI provider status",
        },
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=False,
    )
# Reload triggered to load new MAX_TOKENS limit

