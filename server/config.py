import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("docforge")


class Config:
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # AI Provider — any OpenAI-compatible endpoint
    # Self-hosted (Ollama, vLLM, LM Studio) or cloud (OpenAI, OpenRouter)
    AI_BASE_URL: str = os.getenv("AI_BASE_URL", "http://localhost:11434/v1")
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")  # Optional for self-hosted
    AI_MODEL: str = os.getenv("AI_MODEL", "llama3")
    AI_TIMEOUT: float = float(os.getenv("AI_TIMEOUT", "300.0"))

    # Generation settings
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "4000"))
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))

    # Request limits
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "500000"))  # 500KB per file
    MAX_FILES: int = int(os.getenv("MAX_FILES", "100"))

    # CORS
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Supported languages mapping
    SUPPORTED_LANGUAGES: dict = {
        "javascript": "javascript",
        "js": "javascript",
        "typescript": "typescript",
        "ts": "typescript",
        "python": "python",
        "py": "python",
        "go": "go",
        "golang": "go",
        "rust": "rust",
        "java": "java",
        "php": "php",
        "ruby": "ruby",
        "c": "c",
        "cpp": "cpp",
        "c++": "cpp",
        "csharp": "csharp",
        "c#": "csharp",
        "kotlin": "kotlin",
        "swift": "swift",
    }


config = Config()


def validate_config():
    """Validate configuration at startup and log summary."""
    logger.info("=" * 50)
    logger.info("DocForge Server Configuration")
    logger.info("=" * 50)
    logger.info(f"  Host:          {config.HOST}:{config.PORT}")
    logger.info(f"  AI Base URL:   {config.AI_BASE_URL}")
    logger.info(f"  AI Model:      {config.AI_MODEL}")
    logger.info(f"  AI Timeout:    {config.AI_TIMEOUT}s")
    logger.info(f"  AI API Key:    {'***' + config.AI_API_KEY[-4:] if config.AI_API_KEY else '(none — self-hosted mode)'}")
    logger.info(f"  Max Tokens:    {config.MAX_TOKENS}")
    logger.info(f"  Temperature:   {config.TEMPERATURE}")
    logger.info(f"  Rate Limit:    {config.RATE_LIMIT_PER_MINUTE}/min")
    logger.info(f"  Max Files:     {config.MAX_FILES}")
    logger.info(f"  Max File Size: {config.MAX_FILE_SIZE // 1000}KB")
    logger.info(f"  CORS Origins:  {config.CORS_ORIGINS}")
    logger.info(f"  Log Level:     {config.LOG_LEVEL}")
    logger.info("=" * 50)

    if not config.AI_BASE_URL:
        logger.error("AI_BASE_URL is not set! Server cannot generate docs without an AI endpoint.")
        raise ValueError("AI_BASE_URL must be configured")
