import json
import re
import logging
from models.schemas import GenerateRequest, RefineRequest

logger = logging.getLogger("docforge.services.doc_generator")


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


def get_system_prompt(filename: str) -> str:
    guidelines = ""
    if filename == "README.md":
        guidelines = "The README.md should contain: Project name, Description/Overview, Features, Installation instructions, Quick Start/Usage guide, and Contribution guidelines."
    elif filename == "API.md":
        guidelines = "The API.md should contain detailed reference documentation for all public endpoints, classes, methods, functions, their parameters (with types), and return values found in the source code."
    elif filename == "ARCHITECTURE.md":
        guidelines = "The ARCHITECTURE.md should outline the high-level design of the project, codebase directory structure, key component modules, design patterns used, and the flow of data between components. In addition, include a detailed 'Semantic Design System' section outlining: 1) Visual Theme & Atmosphere (mood, density, aesthetic philosophy), 2) Color Palette & Roles (list key colors with natural descriptive names, hex codes in parentheses, and functional roles), 3) Typography Rules, 4) Component Stylings (buttons, cards, inputs), and 5) Layout Principles (margins, spacing, grid alignment)."
    elif filename == "CHANGELOG.md":
        guidelines = "The CHANGELOG.md should list a history of changes or releases, structured chronologically using the provided git commits context. Group changes by type (e.g., Added, Changed, Fixed) where appropriate."
    elif filename == "introduction.md":
        guidelines = "The introduction.md should contain a high-level, user-friendly overview of the application. Explain what the project is, its main purpose, target audience, and how to get started using it from a user's perspective. Avoid developer-specific details like codebase directory structures, source code paths, internal API protocols, or software package dependencies. Absolutely no backend code blocks, SQL queries, or technical system references."
    elif filename == "features.md":
        guidelines = "The features.md should outline all major user-facing features and capabilities of the application. For each feature, explain what it does, how it benefits the user, and provide step-by-step user instructions or guides on how to interact with it. Keep the focus entirely on user actions, avoiding internal implementation details, code logic, database structures, or technical variables. Absolutely no code blocks, endpoint URLs, or system schemas."
    elif filename == "configuration.md":
        guidelines = "The configuration.md should provide a guide for end-users, administrators, or deployers on how to configure and setup the application. Detail key user settings, customization options, environment configurations, and setup steps required to run or configure the app. Do NOT include technical database migrations, internal architecture flow diagrams, class/methods schemas, backend endpoints (like POST/GET paths), database tables, or API route definitions. Keep it strictly focused on user settings and config files."

    return f"""You are DocForge, an expert technical documentation generator. You analyze source code and generate comprehensive, well-structured documentation.

You output ONLY the raw, complete markdown content of the requested document: {filename}.
Do NOT output any explanations, apologies, or preamble. Do NOT wrap the output in JSON or anything else. Output ONLY the raw markdown document content.

Do NOT use emojis anywhere in the documentation. Keep the tone clean, professional, and technical to avoid AI-generated aesthetic tropes.

Specific guidelines for {filename}:
{guidelines}
"""


def build_prompt_for_file(request: GenerateRequest, filename: str) -> str:
    """Build the prompt for AI to generate a specific documentation file"""
    
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
    
    framework_section = f"\nDetected Framework/Language: {request.framework}\n" if request.framework else ""

    prompt = f"""Project: {request.project_name}{framework_section}

Source files ({len(request.files)} files):
{files_section}
{git_info}

Please generate the documentation file: {filename}

Below are the source files to analyze:

{code_section}

Please write and return the complete {filename} content. Remember to output ONLY the raw markdown content of {filename}. No JSON wrapping, no preamble.
"""
    return prompt


def clean_markdown_response(text: str) -> str:
    cleaned = text.strip()
    # Check if the whole response is wrapped in a code block
    if cleaned.startswith("```"):
        # Split by first newline
        first_newline = cleaned.find("\n")
        if first_newline != -1:
            # Check if there is a closing fence
            if cleaned.endswith("```"):
                # Extract content between the first newline and the closing ```
                inner = cleaned[first_newline+1:-3].strip()
                return inner
    return cleaned


async def generate_docs_from_code(request: GenerateRequest) -> tuple[dict[str, str], int]:
    """
    Generate documentation from code files.
    Returns (docs_dict, tokens_used)
    """
    from services.ai_provider import get_ai_provider
    import asyncio
    
    ai = get_ai_provider()
    
    # Identify which files need to be generated
    options = request.options
    targets = []
    if options.include_readme:
        targets.append("README.md")
    if options.include_api:
        targets.append("API.md")
    if options.include_architecture:
        targets.append("ARCHITECTURE.md")
    if options.include_changelog:
        targets.append("CHANGELOG.md")
    if options.include_introduction:
        targets.append("introduction.md")
    if options.include_features:
        targets.append("features.md")
    if options.include_configuration:
        targets.append("configuration.md")
        
    if not targets:
        return {}, 0
        
    # Helper to generate a single document
    async def generate_single_doc(filename: str) -> tuple[str, str, int]:
        logger.info(f"Generating {filename} for project {request.project_name}...")
        prompt = build_prompt_for_file(request, filename)
        sys_prompt = get_system_prompt(filename)
        
        # If there is existing content for this document, instruct AI to edit & append
        if request.existing_docs and filename in request.existing_docs and request.existing_docs[filename]:
            existing_content = request.existing_docs[filename]
            prompt += (
                f"\n\nAn existing version of {filename} is already present in the workspace:\n"
                f"--- EXISTING {filename} START ---\n"
                f"{existing_content}\n"
                f"--- EXISTING {filename} END ---\n\n"
                f"CRITICAL: Do NOT rewrite {filename} from scratch or ignore the existing content. "
                f"Your task is to EDIT, REFINE, and APPEND to the existing content, adding new details, "
                f"sections, or updates from the newly scanned code files while keeping the original structure, "
                f"introduction, and existing manual information intact. Integrate the new information smoothly."
            )
            sys_prompt += (
                f"\n\nCRITICAL: An existing version of {filename} is provided. "
                f"You must NOT discard or rewrite the existing content from scratch. "
                f"Your task is to EDIT, REFINE, and APPEND to the existing text. Keep all useful existing "
                f"information, formatting, and structure, and merge in updates/details based on the new codebase scan. "
                f"Return the complete updated markdown."
            )
        
        generated_text, tokens = await ai.generate(
            prompt=prompt,
            system_prompt=sys_prompt,
        )
        cleaned_text = clean_markdown_response(generated_text)
        logger.info(f"Finished generating draft for {filename} ({tokens} tokens)")

        # Quality Control Self-Review Pass
        logger.info(f"Performing Quality Control self-review for {filename}...")
        review_sys_prompt = f"""You are DocForge Quality Control Reviewer.
Your task is to analyze the generated draft for {filename} and make sure it is complete, correct, has NO placeholders (like TODO, [Insert here], etc.), uses correct markdown syntax, and adheres to professional technical documentation standards.

CRITICAL INSTRUCTIONS:
1. If the draft documentation is already excellent, complete, accurate, and needs no fixes, reply with EXACTLY the text: NO_CHANGE
2. If there are ANY issues (e.g. placeholders, formatting errors, incomplete sections, or low-quality descriptions), rewrite the documentation to fix them and output the complete, corrected markdown document.
3. You must output ONLY the raw corrected markdown or the literal word NO_CHANGE. Do NOT include any explanations, apologies, preamble, or markdown code block wrapper (unless the document itself is a code block).
"""

        review_prompt = f"""Please review the following generated draft for {filename}:

--- DRAFT START ---
{cleaned_text}
--- DRAFT END ---

Evaluate it for:
- Presence of placeholders like "TODO", "[insert here]", "...", or incomplete instructions.
- Correct markdown format (headings, lists, tables).
- Professional tone and technical accuracy based on the provided source code context.

If it requires improvements, output the complete, fully updated version. If it is already perfect, reply with exactly: NO_CHANGE
"""
        review_response, review_tokens = await ai.generate(
            prompt=review_prompt,
            system_prompt=review_sys_prompt,
        )
        tokens += review_tokens
        review_response_cleaned = review_response.strip()
        
        if "NO_CHANGE" not in review_response_cleaned:
            # Clean response and overwrite
            corrected_text = clean_markdown_response(review_response_cleaned)
            # Make sure we didn't get empty string or garbage
            if corrected_text and len(corrected_text) > 10:
                logger.info(f"Quality Control updated {filename} to fix issues.")
                cleaned_text = corrected_text
            else:
                logger.warning(f"Quality Control returned invalid text for {filename}, keeping original draft.")
        else:
            logger.info(f"Quality Control passed for {filename} with no changes required.")

        logger.info(f"Finished generating {filename} (total {tokens} tokens)")
        return filename, cleaned_text, tokens
            
    # Run in parallel
    results = await asyncio.gather(*(generate_single_doc(t) for t in targets))
    
    docs = {}
    total_tokens = 0
    for filename, content, tokens in results:
        docs[filename] = content
        total_tokens += tokens
        
    return docs, total_tokens


async def refine_docs_with_feedback(request: RefineRequest) -> tuple[dict[str, str], int]:
    """
    Refine existing documentation files based on user feedback.
    Returns (updated_docs_dict, tokens_used)
    """
    from services.ai_provider import get_ai_provider
    import asyncio
    
    ai = get_ai_provider()
    updated_docs = {}
    total_tokens = 0
    
    # Build source code context
    file_list = []
    code_summary = []
    for f in request.files:
        lang = f.language.upper()
        file_list.append(f"- `{f.path}` ({lang})")
        content = f.content
        if len(content) > 3000:
            content = content[:3000] + f"\n... (truncated, total {len(f.content)} chars)"
        code_summary.append(f"### File: {f.path}\n\n```{lang}\n{content}\n```")
    
    files_section = "\n".join(file_list)
    code_section = "\n\n".join(code_summary)
    framework_section = f"\nDetected Framework/Language: {request.framework}\n" if request.framework else ""
    
    async def refine_single_doc(filename: str, current_content: str) -> tuple[str, str, int]:
        logger.info(f"Refining {filename} with feedback: '{request.feedback[:50]}...'")
        
        sys_prompt = f"""You are DocForge, an expert technical documentation generator.
Your task is to refine and update the existing documentation file: {filename} based on the user's feedback.

CRITICAL INSTRUCTIONS:
1. If the user feedback does NOT require any changes to {filename}, reply with EXACTLY the text: NO_CHANGE
2. If changes are required, apply the feedback carefully, keeping the rest of the document structure, formatting, and content intact. Output the complete, updated markdown document.
3. You must output ONLY the raw updated markdown or the literal word NO_CHANGE. Do NOT include any explanations, apologies, preamble, or markdown code block wrappers (unless the document itself is a code block).
"""

        prompt = f"""Project: {request.project_name}{framework_section}

Source files:
{files_section}

Below are the source files for context:
{code_section}

Here is the CURRENT content of {filename}:
--- CURRENT {filename} START ---
{current_content}
--- CURRENT {filename} END ---

User feedback / instruction for modification:
"{request.feedback}"

Please apply this feedback to update {filename}. If the feedback does not apply to this file or no changes are needed, reply with exactly: NO_CHANGE
"""
        generated_text, tokens = await ai.generate(
            prompt=prompt,
            system_prompt=sys_prompt,
        )
        cleaned_text = clean_markdown_response(generated_text)
        cleaned_text_stripped = cleaned_text.strip()
        
        if "NO_CHANGE" in cleaned_text_stripped and len(cleaned_text_stripped) < 20:
            logger.info(f"No changes needed for {filename}")
            return filename, current_content, tokens
        else:
            logger.info(f"Applied refinement changes to {filename}")
            return filename, cleaned_text, tokens
            
    # Run refinement for all files in parallel
    results = await asyncio.gather(*(
        refine_single_doc(filename, content)
        for filename, content in request.current_docs.items()
    ))
    
    for filename, content, tokens in results:
        updated_docs[filename] = content
        total_tokens += tokens
        
    return updated_docs, total_tokens
