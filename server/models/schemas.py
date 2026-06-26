from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, timezone
from config import config


class FileInput(BaseModel):
    path: str = Field(..., description="File path relative to project root")
    content: str = Field(..., description="File content")
    language: str = Field(..., description="Programming language")

    @field_validator("content")
    @classmethod
    def validate_content_size(cls, v):
        if len(v) > config.MAX_FILE_SIZE:
            raise ValueError(
                f"File content exceeds maximum size of {config.MAX_FILE_SIZE // 1000}KB"
            )
        return v

    @field_validator("path")
    @classmethod
    def validate_path(cls, v):
        # Prevent path traversal attacks
        if ".." in v or v.startswith("/"):
            raise ValueError("Invalid file path: must be relative and cannot contain '..'")
        return v


class GitContext(BaseModel):
    recent_commits: list[str] = Field(default_factory=list, description="Recent commit messages")
    branch: str = Field(default="main", description="Current branch name")


class GenerateOptions(BaseModel):
    include_readme: bool = Field(default=True, description="Generate README.md")
    include_api: bool = Field(default=True, description="Generate API.md")
    include_architecture: bool = Field(
        default=False, description="Generate ARCHITECTURE.md"
    )
    include_changelog: bool = Field(default=False, description="Generate CHANGELOG.md")
    include_introduction: bool = Field(default=False, description="Generate introduction.md")
    include_features: bool = Field(default=False, description="Generate features.md")
    include_configuration: bool = Field(default=False, description="Generate configuration.md")


class GenerateRequest(BaseModel):
    project_name: str = Field(..., description="Project name", max_length=200)
    files: list[FileInput] = Field(..., description="Source code files")
    git_context: Optional[GitContext] = Field(default=None, description="Git context")
    options: GenerateOptions = Field(default_factory=GenerateOptions)
    framework: Optional[str] = Field(default=None, description="Detected framework")
    existing_docs: Optional[dict[str, str]] = Field(default=None, description="Existing docs to edit & append")

    @field_validator("files")
    @classmethod
    def validate_files_count(cls, v):
        if len(v) == 0:
            raise ValueError("At least one file is required")
        if len(v) > config.MAX_FILES:
            raise ValueError(
                f"Too many files: {len(v)}. Maximum is {config.MAX_FILES}"
            )
        return v


class RepoDownloadRequest(BaseModel):
    repo_url: str = Field(..., description="Git repository URL")
    branch: str = Field(default="main", description="Branch to clone")
    include_patterns: list[str] = Field(
        default=["*.js", "*.ts", "*.py", "*.go", "*.java"],
        description="File patterns to include",
    )
    exclude_patterns: list[str] = Field(
        default=["node_modules/**", "*.test.js", "__pycache__/**", "*.test.ts"],
        description="File patterns to exclude",
    )
    options: GenerateOptions = Field(default_factory=GenerateOptions)

    @field_validator("repo_url")
    @classmethod
    def validate_repo_url(cls, v):
        if not v.startswith(("https://", "http://", "git@")):
            raise ValueError("repo_url must start with https://, http://, or git@")
        return v


class RefineRequest(BaseModel):
    project_name: str = Field(..., description="Project name", max_length=200)
    files: list[FileInput] = Field(..., description="Source code files")
    current_docs: dict[str, str] = Field(..., description="Current generated docs to refine")
    feedback: str = Field(..., description="User feedback/instructions for modification")
    framework: Optional[str] = Field(default=None, description="Detected framework")
    options: Optional[GenerateOptions] = Field(default=None, description="Generation options")


class GenerateMetadata(BaseModel):
    files_processed: int
    tokens_used: int
    generated_at: datetime


class GenerateResponse(BaseModel):
    success: bool
    docs: dict[str, str]
    metadata: GenerateMetadata


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
