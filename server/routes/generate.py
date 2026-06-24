import logging
from fastapi import APIRouter, HTTPException
from models.schemas import GenerateRequest, GenerateResponse, GenerateMetadata
from services.doc_generator import generate_docs_from_code
from datetime import datetime, timezone

logger = logging.getLogger("docforge.routes.generate")

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
async def generate_docs(request: GenerateRequest):
    """
    Generate documentation from source code files.
    
    Send code files + options, receive generated markdown documentation.
    """
    logger.info(
        f"Generate request: project={request.project_name}, "
        f"files={len(request.files)}"
    )

    try:
        docs, tokens_used = await generate_docs_from_code(request)
        
        metadata = GenerateMetadata(
            files_processed=len(request.files),
            tokens_used=tokens_used,
            generated_at=datetime.now(timezone.utc),
        )

        logger.info(
            f"Generation complete: project={request.project_name}, "
            f"docs={list(docs.keys())}, tokens={tokens_used}"
        )
        
        return GenerateResponse(
            success=True,
            docs=docs,
            metadata=metadata,
        )
    
    except (ValueError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Generation failed (client error): {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Generation failed (server error): {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
