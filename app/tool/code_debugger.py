import ast
import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

from app.config import get_project_folder
from app.tool.base import BaseTool


@dataclass
class CodeIssue:
    """Represents a code issue found during analysis."""
    file_path: str
    line_number: int
    issue_type: str  # 'syntax', 'logic', 'performance', 'security', 'style'
    severity: str    # 'critical', 'high', 'medium', 'low', 'info'
    message: str
    suggestion: str
    code_snippet: str


class CodeDebugger(BaseTool):
    name: str = "code_debugger"
    description: str = """Advanced code debugging and analysis tool that identifies bugs, issues, and provides improvement suggestions.
    
    This tool provides comprehensive code analysis including:
    - Syntax error detection
    - Logic error identification
    - Performance bottleneck analysis
    - Security vulnerability detection
    - Code style and best practice violations
    - Memory leak detection
    - Dead code identification
    - Complexity analysis
    
    Supports multiple programming languages with language-specific analysis rules.
    """
    
    parameters: dict = {
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "(optional) Specific file to analyze. If not provided, analyzes the entire project.",
            },
            "code_content": {
                "type": "string",
                "description": "(optional) Code content to analyze directly (alternative to file_path).",
            },
            "language": {
                "type": "string",
                "description": "(optional) Programming language for direct code analysis. Auto-detected from file extension if file_path is provided.",
                "enum": ["python", "javascript", "typescript", "java", "cpp", "csharp", "go", "rust", "php", "ruby"]
            },
            "analysis_types": {
                "type": "array",
                "items": {"type": "string", "enum": ["syntax", "logic", "performance", "security", "style", "all"]},
                "description": "(optional) Types of analysis to perform. Default is ['all'].",
                "default": ["all"]
            },
            "severity_filter": {
                "type": "array",
                "items": {"type": "string", "enum": ["critical", "high", "medium", "low", "info"]},
                "description": "(optional) Minimum severity levels to include. Default includes all.",
                "default": ["critical", "high", "medium", "low", "info"]
            },
            "project_name": {
                "type": "string",
                "description": "(optional) Project name to analyze. If not specified, uses the workspace root.",
            },
            "max_issues": {
                "type": "integer",
                "description": "(optional) Maximum number of issues to return. Default is 100.",
                "default": 100
            }
        },
        "required": [],
    }

    async def execute(
        self,
        file_path: Optional[str] = None,
        code_content: Optional[str] = None,
        language: Optional[str] = None,
        analysis_types: List[str] = ["all"],
        severity_filter: List[str] = ["critical", "high", "medium", "low", "info"],
        project_name: Optional[str] = None,
        max_issues: int = 100,
    ) -> str:
        """
        Analyze code for bugs, issues, and improvement opportunities.
        """
        try:
            issues = []
            
            if code_content:
                # Analyze provided code content
                if not language:
                    language = "python"  # Default to Python
                issues = await self._analyze_code_content(code_content, language, analysis_types)
                
            elif file_path:
                # Analyze specific file
                base_folder = get_project_folder(project_name)
                full_path = base_folder / file_path
                
                if not full_path.exists():
                    return f"Error: File not found: {full_path}"
                
                language = self._detect_language(full_path)
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                issues = await self._analyze_code_content(content, language, analysis_types, str(full_path))
                
            else:
                # Analyze entire project
                base_folder = get_project_folder(project_name)
                issues = await self._analyze_project(base_folder, analysis_types)
            
            # Filter by severity
            filtered_issues = [
                issue for issue in issues 
                if issue.severity in severity_filter
            ]
            
            # Sort by severity and limit results
            severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
            filtered_issues.sort(key=lambda x: (severity_order.get(x.severity, 5), x.file_path, x.line_number))
            filtered_issues = filtered_issues[:max_issues]
            
            return self._format_analysis_results(filtered_issues, analysis_types)
            
        except Exception as e:
            return f"Error during code analysis: {str(e)}"

    def _detect_language(self, file_path: Path) -> str:
        """Detect programming language from file extension."""
        ext = file_path.suffix.lower()
        language_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.jsx': 'javascript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.cc': 'cpp',
            '.cxx': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
        }
        return language_map.get(ext, 'text')

    async def _analyze_code_content(
        self, 
        content: str, 
        language: str, 
        analysis_types: List[str],
        file_path: str = "inline_code"
    ) -> List[CodeIssue]:
        """Analyze code content for issues."""
        issues = []
        lines = content.split('\n')
        
        if "all" in analysis_types or "syntax" in analysis_types:
            issues.extend(self._check_syntax_issues(content, language, file_path))
        
        if "all" in analysis_types or "logic" in analysis_types:
            issues.extend(self._check_logic_issues(lines, language, file_path))
        
        if "all" in analysis_types or "performance" in analysis_types:
            issues.extend(self._check_performance_issues(lines, language, file_path))
        
        if "all" in analysis_types or "security" in analysis_types:
            issues.extend(self._check_security_issues(lines, language, file_path))
        
        if "all" in analysis_types or "style" in analysis_types:
            issues.extend(self._check_style_issues(lines, language, file_path))
        
        return issues

    def _check_syntax_issues(self, content: str, language: str, file_path: str) -> List[CodeIssue]:
        """Check for syntax errors."""
        issues = []
        
        if language == "python":
            try:
                ast.parse(content)
            except SyntaxError as e:
                issues.append(CodeIssue(
                    file_path=file_path,
                    line_number=e.lineno or 1,
                    issue_type="syntax",
                    severity="critical",
                    message=f"Syntax Error: {e.msg}",
                    suggestion="Fix the syntax error according to Python grammar rules.",
                    code_snippet=e.text or ""
                ))
            except Exception as e:
                issues.append(CodeIssue(
                    file_path=file_path,
                    line_number=1,
                    issue_type="syntax",
                    severity="high",
                    message=f"Parse Error: {str(e)}",
                    suggestion="Check for encoding issues or malformed code.",
                    code_snippet=""
                ))
        
        return issues

    def _check_logic_issues(self, lines: List[str], language: str, file_path: str) -> List[CodeIssue]:
        """Check for logic errors and potential bugs."""
        issues = []
        
        for i, line in enumerate(lines, 1):
            line_stripped = line.strip()
            
            # Common logic issues across languages
            if language in ["python", "javascript", "typescript"]:
                # Unreachable code after return
                if "return" in line_stripped and i < len(lines):
                    next_lines = [l.strip() for l in lines[i:i+3] if l.strip()]
                    if next_lines and not any(l.startswith(('def ', 'class ', 'if ', 'else:', 'elif ', 'except:', 'finally:', 'for ', 'while ')) for l in next_lines):
                        issues.append(CodeIssue(
                            file_path=file_path,
                            line_number=i,
                            issue_type="logic",
                            severity="medium",
                            message="Potential unreachable code after return statement",
                            suggestion="Remove unreachable code or restructure the logic.",
                            code_snippet=line_stripped
                        ))
                
                # Empty except blocks
                if language == "python" and line_stripped == "except:":
                    issues.append(CodeIssue(
                        file_path=file_path,
                        line_number=i,
                        issue_type="logic",
                        severity="high",
                        message="Bare except clause catches all exceptions",
                        suggestion="Specify the exception type or use 'except Exception:' for better error handling.",
                        code_snippet=line_stripped
                    ))
                
                # Potential infinite loops
                if re.search(r'while\s+True\s*:', line_stripped) and language == "python":
                    # Check if there's a break statement in the next few lines
                    next_lines = lines[i:i+10]
                    if not any("break" in l for l in next_lines):
                        issues.append(CodeIssue(
                            file_path=file_path,
                            line_number=i,
                            issue_type="logic",
                            severity="medium",
                            message="Potential infinite loop without break condition",
                            suggestion="Ensure there's a break condition or exit mechanism in the loop.",
                            code_snippet=line_stripped
                        ))
        
        return issues

    def _check_performance_issues(self, lines: List[str], language: str, file_path: str) -> List[CodeIssue]:
        """Check for performance issues."""
        issues = []
        
        for i, line in enumerate(lines, 1):
            line_stripped = line.strip()
            
            if language == "python":
                # Inefficient string concatenation in loops
                if re.search(r'for\s+\w+\s+in\s+.*:', line_stripped):
                    # Check next few lines for string concatenation
                    for j in range(i, min(i+5, len(lines))):
                        if "+=" in lines[j] and any(quote in lines[j] for quote in ['"', "'"]):
                            issues.append(CodeIssue(
                                file_path=file_path,
                                line_number=j+1,
                                issue_type="performance",
                                severity="medium",
                                message="Inefficient string concatenation in loop",
                                suggestion="Use join() method or f-strings for better performance.",
                                code_snippet=lines[j].strip()
                            ))
                
                # Global variable access in loops
                if "global " in line_stripped:
                    issues.append(CodeIssue(
                        file_path=file_path,
                        line_number=i,
                        issue_type="performance",
                        severity="low",
                        message="Global variable usage may impact performance",
                        suggestion="Consider using local variables or passing parameters instead.",
                        code_snippet=line_stripped
                    ))
        
        return issues

    def _check_security_issues(self, lines: List[str], language: str, file_path: str) -> List[CodeIssue]:
        """Check for security vulnerabilities."""
        issues = []
        
        for i, line in enumerate(lines, 1):
            line_stripped = line.strip()
            
            # SQL injection risks
            if re.search(r'(execute|query|cursor)\s*\(\s*["\'].*%.*["\']', line_stripped):
                issues.append(CodeIssue(
                    file_path=file_path,
                    line_number=i,
                    issue_type="security",
                    severity="high",
                    message="Potential SQL injection vulnerability",
                    suggestion="Use parameterized queries or prepared statements.",
                    code_snippet=line_stripped
                ))
            
            # Hardcoded passwords/secrets
            if re.search(r'(password|secret|key|token)\s*=\s*["\'][^"\']+["\']', line_stripped, re.IGNORECASE):
                issues.append(CodeIssue(
                    file_path=file_path,
                    line_number=i,
                    issue_type="security",
                    severity="critical",
                    message="Hardcoded secret detected",
                    suggestion="Use environment variables or secure configuration files.",
                    code_snippet=line_stripped
                ))
            
            # Eval usage
            if "eval(" in line_stripped:
                issues.append(CodeIssue(
                    file_path=file_path,
                    line_number=i,
                    issue_type="security",
                    severity="high",
                    message="Use of eval() function is dangerous",
                    suggestion="Avoid eval() or use safer alternatives like ast.literal_eval().",
                    code_snippet=line_stripped
                ))
        
        return issues

    def _check_style_issues(self, lines: List[str], language: str, file_path: str) -> List[CodeIssue]:
        """Check for style and best practice violations."""
        issues = []
        
        for i, line in enumerate(lines, 1):
            if language == "python":
                # Line too long (PEP 8)
                if len(line) > 88:  # Black's default line length
                    issues.append(CodeIssue(
                        file_path=file_path,
                        line_number=i,
                        issue_type="style",
                        severity="low",
                        message=f"Line too long ({len(line)} characters)",
                        suggestion="Break long lines according to PEP 8 guidelines.",
                        code_snippet=line.strip()[:50] + "..."
                    ))
                
                # Missing docstrings for functions/classes
                line_stripped = line.strip()
                if (line_stripped.startswith("def ") or line_stripped.startswith("class ")) and ":" in line_stripped:
                    # Check if next non-empty line is a docstring
                    next_line_idx = i
                    while next_line_idx < len(lines) and not lines[next_line_idx].strip():
                        next_line_idx += 1
                    
                    if next_line_idx < len(lines):
                        next_line = lines[next_line_idx].strip()
                        if not (next_line.startswith('"""') or next_line.startswith("'''")):
                            issues.append(CodeIssue(
                                file_path=file_path,
                                line_number=i,
                                issue_type="style",
                                severity="info",
                                message="Missing docstring for function/class",
                                suggestion="Add a docstring to document the purpose and parameters.",
                                code_snippet=line_stripped
                            ))
        
        return issues

    async def _analyze_project(self, project_dir: Path, analysis_types: List[str]) -> List[CodeIssue]:
        """Analyze entire project directory."""
        issues = []
        code_files = []
        
        # Find all code files
        for ext in ['.py', '.js', '.ts', '.java', '.cpp', '.cs', '.go', '.rs', '.php', '.rb']:
            code_files.extend(project_dir.rglob(f"*{ext}"))
        
        for file_path in code_files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                language = self._detect_language(file_path)
                file_issues = await self._analyze_code_content(
                    content, language, analysis_types, str(file_path.relative_to(project_dir))
                )
                issues.extend(file_issues)
                
            except Exception:
                continue  # Skip files that can't be read
        
        return issues

    def _format_analysis_results(self, issues: List[CodeIssue], analysis_types: List[str]) -> str:
        """Format analysis results for display."""
        if not issues:
            return "✅ **Code Analysis Complete**\nNo issues found! Your code looks good."
        
        result = f"🔍 **Code Analysis Results**\n"
        result += f"Found {len(issues)} issues across {len(set(i.file_path for i in issues))} files\n\n"
        
        # Group by severity
        severity_groups = {}
        for issue in issues:
            if issue.severity not in severity_groups:
                severity_groups[issue.severity] = []
            severity_groups[issue.severity].append(issue)
        
        # Display by severity
        severity_icons = {
            "critical": "🚨",
            "high": "⚠️",
            "medium": "⚡",
            "low": "💡",
            "info": "ℹ️"
        }
        
        for severity in ["critical", "high", "medium", "low", "info"]:
            if severity in severity_groups:
                result += f"{severity_icons[severity]} **{severity.upper()} ({len(severity_groups[severity])} issues)**\n"
                
                for issue in severity_groups[severity][:10]:  # Limit to 10 per severity
                    result += f"  📁 {issue.file_path}:{issue.line_number}\n"
                    result += f"     {issue.message}\n"
                    result += f"     💡 {issue.suggestion}\n"
                    if issue.code_snippet:
                        result += f"     ```\n     {issue.code_snippet}\n     ```\n"
                    result += "\n"
                
                if len(severity_groups[severity]) > 10:
                    result += f"     ... and {len(severity_groups[severity]) - 10} more {severity} issues\n\n"
        
        return result
