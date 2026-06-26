import httpx
import logging
import time
from typing import Optional
from config import config

logger = logging.getLogger("docforge.ai")


class AIProvider:
    """
    Unified AI provider using OpenAI-compatible chat completions API.
    
    Works with any OpenAI-compatible endpoint:
    - Self-hosted: Ollama, vLLM, LM Studio, llama.cpp
    - Cloud: OpenAI, OpenRouter, Together AI, Groq
    """

    def __init__(self):
        self.base_url = config.AI_BASE_URL.rstrip("/")
        self.api_key = config.AI_API_KEY
        self.model = config.AI_MODEL

        logger.info(f"AI Provider initialized: {self.base_url} (model: {self.model})")

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
    ) -> tuple[str, int]:
        """
        Generate text using OpenAI-compatible chat completions API.
        Returns (generated_text, tokens_used)
        """
        model = model or self.model
        max_tokens = max_tokens or config.MAX_TOKENS

        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Build headers
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        data = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": config.TEMPERATURE,
        }

        start_time = time.time()

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    json=data,
                    headers=headers,
                    timeout=config.AI_TIMEOUT,
                )
                response.raise_for_status()
                result = response.json()

            # Extract response
            generated_text = result["choices"][0]["message"]["content"]

            # Extract token usage (may not be available from all providers)
            usage = result.get("usage", {})
            tokens_used = usage.get("total_tokens", 0)
            if tokens_used == 0:
                # Some providers report input/output separately
                tokens_used = usage.get("prompt_tokens", 0) + usage.get("completion_tokens", 0)

            elapsed = time.time() - start_time
            logger.info(
                f"AI generation complete: model={model}, "
                f"tokens={tokens_used}, time={elapsed:.1f}s"
            )

            return generated_text, tokens_used

        except httpx.ConnectError:
            logger.error(f"Cannot connect to AI provider at {self.base_url}")
            raise ConnectionError(
                f"Cannot connect to AI provider at {self.base_url}. "
                f"Make sure your AI server is running."
            )
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            detail = e.response.text[:500]
            logger.error(f"AI provider returned {status}: {detail}")
            if status == 401:
                raise ValueError("AI provider authentication failed. Check AI_API_KEY.")
            elif status == 404:
                raise ValueError(
                    f"Model '{model}' not found. Make sure the model is available "
                    f"on your AI provider at {self.base_url}."
                )
            elif status == 429:
                raise ValueError("AI provider rate limit exceeded. Try again later.")
            else:
                raise ValueError(f"AI provider error ({status}): {detail}")
        except httpx.TimeoutException:
            logger.error(f"AI generation timed out after {config.AI_TIMEOUT}s")
            raise TimeoutError("AI generation timed out. The request may be too large.")
        except (KeyError, IndexError) as e:
            logger.error(f"Unexpected AI response format: {e}")
            raise ValueError(f"Unexpected response from AI provider: {e}")

    async def check_health(self) -> dict:
        """
        Check if the AI provider is reachable.
        Returns status dict.
        """
        try:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            async with httpx.AsyncClient() as client:
                # Try the models endpoint (most OpenAI-compatible servers support this)
                response = await client.get(
                    f"{self.base_url}/models",
                    headers=headers,
                    timeout=5.0,
                )
                if response.status_code == 200:
                    return {"status": "connected", "base_url": self.base_url, "model": self.model}
                else:
                    return {"status": "error", "base_url": self.base_url, "detail": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"status": "unreachable", "base_url": self.base_url, "detail": str(e)}


# Singleton instance
_provider: Optional[AIProvider] = None


def get_ai_provider() -> AIProvider:
    global _provider
    if _provider is None:
        _provider = AIProvider()
    return _provider
