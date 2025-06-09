import ast
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, ClassVar, Dict, List, Optional, Tuple

from app.config import WORKSPACE_ROOT, get_project_folder
from app.tool.base import BaseTool


@dataclass
class CodeMatch:
    """Represents a code match found during search."""

    file_path: str
    line_number: int
    line_content: str
    context_before: List[str]
    context_after: List[str]
    match_type: str  # 'function', 'class', 'variable', 'pattern', 'comment'
    language: str


class CodebaseSearch(BaseTool):
    name: str = "codebase_search"
    description: str = """Advanced codebase search tool that can find functions, classes, variables, patterns, and code snippets across multiple programming languages.

    This tool provides comprehensive code search capabilities including:
    - Function and method definitions
    - Class definitions and inheritance
    - Variable declarations and usage
    - Code patterns and regular expressions
    - Comments and documentation
    - Import statements and dependencies
    - File structure analysis

    Supports Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, PHP, Ruby, and more.
    """

    parameters: dict = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "(required) The search query - can be function name, class name, variable, or regex pattern.",
            },
            "search_type": {
                "type": "string",
                "description": "(optional) Type of search: 'function', 'class', 'variable', 'pattern', 'comment', 'import', 'all'. Default is 'all'.",
                "enum": [
                    "function",
                    "class",
                    "variable",
                    "pattern",
                    "comment",
                    "import",
                    "all",
                ],
                "default": "all",
            },
            "file_extensions": {
                "type": "array",
                "items": {"type": "string"},
                "description": "(optional) File extensions to search in (e.g., ['.py', '.js', '.ts']). If not specified, searches common code files.",
            },
            "project_name": {
                "type": "string",
                "description": "(optional) Project name to search in. If not specified, searches the entire workspace.",
            },
            "max_results": {
                "type": "integer",
                "description": "(optional) Maximum number of results to return. Default is 50.",
                "default": 50,
            },
            "include_context": {
                "type": "boolean",
                "description": "(optional) Whether to include surrounding code context. Default is True.",
                "default": True,
            },
            "case_sensitive": {
                "type": "boolean",
                "description": "(optional) Whether the search should be case sensitive. Default is False.",
                "default": False,
            },
        },
        "required": ["query"],
    }

    # Common code file extensions
    CODE_EXTENSIONS: ClassVar[Dict[str, str]] = {
        ".py": "python",
        ".js": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".jsx": "javascript",
        ".java": "java",
        ".cpp": "cpp",
        ".cc": "cpp",
        ".cxx": "cpp",
        ".c": "c",
        ".h": "c",
        ".hpp": "cpp",
        ".cs": "csharp",
        ".go": "go",
        ".rs": "rust",
        ".php": "php",
        ".rb": "ruby",
        ".swift": "swift",
        ".kt": "kotlin",
        ".scala": "scala",
        ".r": "r",
        ".m": "objective-c",
        ".sh": "bash",
        ".ps1": "powershell",
        ".sql": "sql",
        ".html": "html",
        ".css": "css",
        ".scss": "scss",
        ".sass": "sass",
        ".less": "less",
        ".xml": "xml",
        ".json": "json",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".toml": "toml",
        ".ini": "ini",
        ".cfg": "ini",
        ".conf": "conf",
        ".md": "markdown",
        ".rst": "rst",
        ".txt": "text",
    }

    async def execute(
        self,
        query: str,
        search_type: str = "all",
        file_extensions: Optional[List[str]] = None,
        project_name: Optional[str] = None,
        max_results: int = 50,
        include_context: bool = True,
        case_sensitive: bool = False,
    ) -> str:
        """
        Search for code patterns, functions, classes, and more across the codebase.
        """
        try:
            # Get the search directory
            search_dir = get_project_folder(project_name)

            if not search_dir.exists():
                return f"Error: Directory not found: {search_dir}"

            # Determine file extensions to search
            if file_extensions is None:
                extensions = list(self.CODE_EXTENSIONS.keys())
            else:
                extensions = file_extensions

            # Find all relevant files
            files_to_search = []
            for ext in extensions:
                files_to_search.extend(search_dir.rglob(f"*{ext}"))

            if not files_to_search:
                return f"No files found with extensions {extensions} in {search_dir}"

            # Perform the search
            matches = []
            for file_path in files_to_search:
                if len(matches) >= max_results:
                    break

                file_matches = await self._search_in_file(
                    file_path, query, search_type, include_context, case_sensitive
                )
                matches.extend(file_matches)

            # Sort matches by relevance and limit results
            matches = sorted(
                matches, key=lambda x: (x.match_type, x.file_path, x.line_number)
            )
            matches = matches[:max_results]

            if not matches:
                return (
                    f"No matches found for '{query}' in {len(files_to_search)} files."
                )

            # Format results
            return self._format_results(matches, query, search_type)

        except Exception as e:
            return f"Error during codebase search: {str(e)}"

    async def _search_in_file(
        self,
        file_path: Path,
        query: str,
        search_type: str,
        include_context: bool,
        case_sensitive: bool,
    ) -> List[CodeMatch]:
        """Search for patterns in a single file."""
        matches = []

        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()

            language = self.CODE_EXTENSIONS.get(file_path.suffix.lower(), "text")

            for i, line in enumerate(lines):
                line_matches = self._find_matches_in_line(
                    line, query, search_type, case_sensitive, language
                )

                for match_type in line_matches:
                    context_before = []
                    context_after = []

                    if include_context:
                        # Get 3 lines before and after for context
                        context_before = [
                            lines[j].rstrip() for j in range(max(0, i - 3), i)
                        ]
                        context_after = [
                            lines[j].rstrip()
                            for j in range(i + 1, min(len(lines), i + 4))
                        ]

                    match = CodeMatch(
                        file_path=str(file_path.relative_to(get_project_folder(None))),
                        line_number=i + 1,
                        line_content=line.rstrip(),
                        context_before=context_before,
                        context_after=context_after,
                        match_type=match_type,
                        language=language,
                    )
                    matches.append(match)

        except Exception as e:
            # Skip files that can't be read
            pass

        return matches

    def _find_matches_in_line(
        self,
        line: str,
        query: str,
        search_type: str,
        case_sensitive: bool,
        language: str,
    ) -> List[str]:
        """Find matches in a single line based on search type."""
        matches = []
        search_line = line if case_sensitive else line.lower()
        search_query = query if case_sensitive else query.lower()

        if search_type in ["all", "pattern"]:
            # Pattern/regex search
            try:
                if re.search(search_query, search_line):
                    matches.append("pattern")
            except re.error:
                # If regex is invalid, do simple string search
                if search_query in search_line:
                    matches.append("pattern")

        if search_type in ["all", "function"]:
            # Function definitions
            func_patterns = {
                "python": [
                    r"def\s+" + re.escape(search_query) + r"\s*\(",
                    r"async\s+def\s+" + re.escape(search_query) + r"\s*\(",
                ],
                "javascript": [
                    r"function\s+" + re.escape(search_query) + r"\s*\(",
                    r"const\s+" + re.escape(search_query) + r"\s*=",
                    r"let\s+" + re.escape(search_query) + r"\s*=",
                ],
                "java": [
                    r"(public|private|protected)?\s*(static)?\s*\w+\s+"
                    + re.escape(search_query)
                    + r"\s*\("
                ],
                "cpp": [r"\w+\s+" + re.escape(search_query) + r"\s*\("],
            }

            patterns = func_patterns.get(
                language, [r"\w*\s*" + re.escape(search_query) + r"\s*\("]
            )
            for pattern in patterns:
                if re.search(
                    pattern, search_line, re.IGNORECASE if not case_sensitive else 0
                ):
                    matches.append("function")
                    break

        if search_type in ["all", "class"]:
            # Class definitions
            class_patterns = {
                "python": [r"class\s+" + re.escape(search_query) + r"\s*[\(:]"],
                "javascript": [r"class\s+" + re.escape(search_query) + r"\s*[{]"],
                "java": [
                    r"(public|private|protected)?\s*class\s+"
                    + re.escape(search_query)
                    + r"\s*[{]"
                ],
                "cpp": [r"class\s+" + re.escape(search_query) + r"\s*[{:]"],
            }

            patterns = class_patterns.get(
                language, [r"class\s+" + re.escape(search_query) + r"\s*"]
            )
            for pattern in patterns:
                if re.search(
                    pattern, search_line, re.IGNORECASE if not case_sensitive else 0
                ):
                    matches.append("class")
                    break

        if search_type in ["all", "variable"]:
            # Variable declarations and usage
            if search_query in search_line:
                matches.append("variable")

        if search_type in ["all", "comment"]:
            # Comments
            comment_patterns = [
                r"#.*" + re.escape(search_query),
                r"//.*" + re.escape(search_query),
                r"/\*.*" + re.escape(search_query),
            ]
            for pattern in comment_patterns:
                if re.search(
                    pattern, search_line, re.IGNORECASE if not case_sensitive else 0
                ):
                    matches.append("comment")
                    break

        if search_type in ["all", "import"]:
            # Import statements
            import_patterns = [
                r"import.*" + re.escape(search_query),
                r"from.*" + re.escape(search_query),
                r"require.*" + re.escape(search_query),
                r"#include.*" + re.escape(search_query),
            ]
            for pattern in import_patterns:
                if re.search(
                    pattern, search_line, re.IGNORECASE if not case_sensitive else 0
                ):
                    matches.append("import")
                    break

        return matches

    def _format_results(
        self, matches: List[CodeMatch], query: str, search_type: str
    ) -> str:
        """Format search results for display."""
        if not matches:
            return f"No matches found for '{query}'"

        result = f"🔍 **Codebase Search Results for '{query}'**\n"
        result += f"Found {len(matches)} matches across {len(set(m.file_path for m in matches))} files\n\n"

        # Group by file
        files_dict = {}
        for match in matches:
            if match.file_path not in files_dict:
                files_dict[match.file_path] = []
            files_dict[match.file_path].append(match)

        for file_path, file_matches in files_dict.items():
            result += f"📁 **{file_path}** ({file_matches[0].language})\n"

            for match in file_matches:
                result += f"  📍 Line {match.line_number} ({match.match_type}):\n"
                result += f"    ```{match.language}\n"

                # Add context if available
                if match.context_before:
                    for ctx_line in match.context_before[
                        -2:
                    ]:  # Show last 2 context lines
                        result += f"    {ctx_line}\n"

                result += f"  → {match.line_content}\n"

                if match.context_after:
                    for ctx_line in match.context_after[
                        :2
                    ]:  # Show first 2 context lines
                        result += f"    {ctx_line}\n"

                result += f"    ```\n\n"

        return result
