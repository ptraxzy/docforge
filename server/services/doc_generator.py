import json
import re
from typing import Optional
from models.schemas import GenerateRequest, GenerateOptions, FileInput


SYSTEM_PROMPT = """You are DocForge, an expert technical documentation generator. You analyze source code and generate comprehensive, well-structured documentation.

You output ONLY valid markdown documentation. No explanations, no apologies, no preamble - just the documentation.

Output format: A JSON object with keys being filenames (e.g., "README.md", "API.md") and values being the markdown content.

Example output format:
{
  "README.md": "# Project Name\\n\\nOverview...",
  "API.md": "## Functions\\n\\n### funcName\\n...",
  "ARCHITECTURE.md": "## Structure\\n\\n..."
}
"""


def build_prompt(request: GenerateRequest) -> str:
    """Build the prompt for AI based on the request"""
    
    # Build file listing
    file_list = []
    code_summary = []
    
    for i, f in enumerate(request.files):
        lang = f.language.upper()
        file_list.append(f"- `{f.path}` ({lang})")
        
        # Truncate very long files
        content = f.content
        if len(content) > 3000:
            content = content[:3000] + f"\n... (truncated, total {len(f.content)} chars)"
        
        code_summary.append(f"### File: {f.path}\n\n```{lang}\n{content}\n```")
    
    files_section = "\n".join(file_list)
    code_section = "\n\n".join(code_summary)
    
    # Git context
    git_info = ""
    if request.git_context:
        commits = request.git_context.recent_commits
        if commits:
            git_info = f"\nRecent commits:\n" + "\n".join(f"- {c}" for c in commits[:10])
    
    # Build options
    options = request.options
    docs_to_generate = []
    if options.include_readme:
        docs_to_generate.append("- README.md (project overview, description, quick start)")
    if options.include_api:
        docs_to_generate.append("- API.md (functions, endpoints, parameters)")
    if options.include_architecture:
        docs_to_generate.append("- ARCHITECTURE.md (structure, modules, data flow)")
    if options.include_changelog:
        docs_to_generate.append("- CHANGELOG.md (version history from git commits)")
    
    docs_section = "\n".join(docs_to_generate)
    
    prompt = f"""Project: {request.project_name}

Source files ({len(request.files)} files):
{files_section}
{git_info}

Generate the following documentation:
{docs_section}

Below are the source files to analyze:

{code_section}

Return ONLY a JSON object with the generated documentation. Keys are filenames, values are markdown content.
"""
    
    return prompt


def parse_ai_response(response_text: str) -> dict[str, str]:
    """
    Parse AI response into structured docs.
    Tries multiple strategies to extract JSON.
    """
    # Clean up response - remove markdown code blocks if present
    cleaned = response_text.strip()
    
    # Remove ```json or ``` wrappers
    if cleaned.startswith("```"):
        # Find the end of opening fence
        lines = cleaned.split("\n")
        if len(lines) > 1:
            cleaned = "\n".join(lines[1:])
            # Remove closing fence
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].strip()
    
    # Try to find JSON object
    json_match = re.search(r'\{[\s\S]*\}', cleaned)
    if json_match:
        json_str = json_match.group(0)
        try:
            docs = json.loads(json_str)
            if isinstance(docs, dict) and all(isinstance(k, str) for k in docs.keys()):
                return docs
        except json.JSONDecodeError:
            pass
    
    # Fallback: if we can't parse, treat the whole response as README.md
    return {"README.md": cleaned}


async def generate_docs_from_code(request: GenerateRequest) -> tuple[dict[str, str], int]:
    """
    Generate documentation from code files.
    Returns (docs_dict, tokens_used)
    """
    from services.ai_provider import get_ai_provider
    
    prompt = build_prompt(request)
    ai = get_ai_provider()
    
    generated_text, tokens_used = await ai.generate(
        prompt=prompt,
        system_prompt=SYSTEM_PROMPT,
    )
    docs = parse_ai_response(generated_text)
    
    return docs, tokens_used
