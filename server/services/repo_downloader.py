import tempfile
import os
import shutil
from pathlib import Path
from typing import Optional
import fnmatch
import git


def clone_repo(repo_url: str, branch: str = "main", dest_dir: Optional[str] = None) -> str:
    """
    Clone a git repository to a temporary directory.
    Returns the path to the cloned repo.
    """
    if dest_dir is None:
        dest_dir = tempfile.mkdtemp(prefix="docforge_")
    
    try:
        git.Repo.clone_from(
            repo_url,
            dest_dir,
            branch=branch,
            depth=50,  # Shallow clone for speed
        )
        return dest_dir
    except git.GitCommandError as e:
        raise ValueError(f"Failed to clone repository: {e}")


def get_files_from_repo(
    repo_path: str,
    include_patterns: list[str] = None,
    exclude_patterns: list[str] = None,
) -> list[dict]:
    """
    Get all files from a repository matching the patterns.
    Returns list of {path, content, language} dicts.
    """
    include_patterns = include_patterns or ["*.js", "*.ts", "*.py", "*.go", "*.java"]
    exclude_patterns = exclude_patterns or ["node_modules/**", "*.test.js", "__pycache__/**"]
    
    # Language detection based on extension
    lang_map = {
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".py": "python",
        ".go": "go",
        ".java": "java",
        ".rb": "ruby",
        ".php": "php",
        ".c": "c",
        ".cpp": "cpp",
        ".h": "c",
        ".hpp": "cpp",
        ".cs": "csharp",
        ".swift": "swift",
        ".kt": "kotlin",
        ".rs": "rust",
    }
    
    files = []
    repo_path_obj = Path(repo_path)
    
    for file_path in repo_path_obj.rglob("*"):
        if not file_path.is_file():
            continue
        
        rel_path = str(file_path.relative_to(repo_path_obj))
        
        # Check exclude patterns
        if any(fnmatch.fnmatch(rel_path, pat.replace("**", "*")) for pat in exclude_patterns):
            continue
        
        # Check include patterns
        if not any(fnmatch.fnmatch(rel_path, pat.replace("**", "*")) for pat in include_patterns):
            continue
        
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            ext = file_path.suffix
            lang = lang_map.get(ext, "text")
            
            files.append({
                "path": rel_path,
                "content": content,
                "language": lang,
            })
        except Exception:
            continue
    
    return files


def get_git_context(repo_path: str) -> dict:
    """
    Extract git context from a repository.
    Returns recent commits and current branch.
    """
    try:
        repo = git.Repo(repo_path)
        branch = repo.active_branch.name
        
        commits = []
        for commit in repo.iter_commits(max_count=20):
            commits.append(commit.message.strip())
        
        return {
            "recent_commits": commits,
            "branch": branch,
        }
    except Exception:
        return {"recent_commits": [], "branch": "main"}


def cleanup_repo(repo_path: str) -> None:
    """Remove a temporary repository directory."""
    try:
        shutil.rmtree(repo_path)
    except Exception:
        pass
