import logging
from fastapi import APIRouter, HTTPException
from models.schemas import (
    RepoDownloadRequest,
    GenerateRequest,
    GenerateResponse,
    GenerateMetadata,
    FileInput,
    GitContext,
)
from services.doc_generator import generate_docs_from_code
from services.repo_downloader import clone_repo, get_files_from_repo, get_git_context, cleanup_repo
from datetime import datetime, timezone

logger = logging.getLogger("docforge.routes.repo")

router = APIRouter()


@router.post("/generate-from-repo", response_model=GenerateResponse)
async def generate_docs_from_repo(request: RepoDownloadRequest):
    """
    Download a git repository and generate documentation from its code.
    """
    repo_path = None

    logger.info(f"Repo generate request: url={request.repo_url}, branch={request.branch}")
    
    try:
        # Clone the repository
        repo_path = clone_repo(request.repo_url, request.branch)
        
        # Get files from repo
        files = get_files_from_repo(
            repo_path,
            include_patterns=request.include_patterns,
            exclude_patterns=request.exclude_patterns,
        )
        
        if not files:
            raise HTTPException(
                status_code=400,
                detail="No files found matching the specified patterns"
            )

        logger.info(f"Cloned repo, found {len(files)} files")
        
        # Get git context
        git_ctx = get_git_context(repo_path)
        
        # Extract project name from URL
        project_name = request.repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        
        # Build request for doc generator
        doc_request = GenerateRequest(
            project_name=project_name,
            files=[FileInput(**f) for f in files],
            git_context=GitContext(**git_ctx),
            options=request.options,
        )
        
        # Generate docs
        docs, tokens_used = await generate_docs_from_code(doc_request)
        
        metadata = GenerateMetadata(
            files_processed=len(files),
            tokens_used=tokens_used,
            generated_at=datetime.now(timezone.utc),
        )

        logger.info(
            f"Repo generation complete: project={project_name}, "
            f"docs={list(docs.keys())}, tokens={tokens_used}"
        )
        
        return GenerateResponse(
            success=True,
            docs=docs,
            metadata=metadata,
        )
    
    except (ValueError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Repo generation failed (client error): {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Repo generation failed (server error): {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process repository: {str(e)}")
    finally:
        # Cleanup
        if repo_path:
            cleanup_repo(repo_path)
