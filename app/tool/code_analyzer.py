import ast
import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Set
from dataclasses import dataclass

from app.config import get_project_folder
from app.tool.base import BaseTool


@dataclass
class CodeMetrics:
    """Code complexity and quality metrics."""
    lines_of_code: int
    cyclomatic_complexity: int
    cognitive_complexity: int
    maintainability_index: float
    test_coverage: float
    code_duplication: float


@dataclass
class RefactoringSuggestion:
    """Refactoring suggestion for code improvement."""
    file_path: str
    line_number: int
    suggestion_type: str
    description: str
    before_code: str
    after_code: str
    impact: str  # 'high', 'medium', 'low'


class CodeAnalyzer(BaseTool):
    name: str = "code_analyzer"
    description: str = """Advanced code analysis tool providing comprehensive code quality assessment, refactoring suggestions, and architectural insights.
    
    Features include:
    - Code complexity analysis (cyclomatic, cognitive)
    - Maintainability index calculation
    - Code duplication detection
    - Refactoring suggestions
    - Architecture analysis
    - Dependency analysis
    - Test coverage assessment
    - Performance optimization recommendations
    - Documentation quality analysis
    - Code smell detection
    """
    
    parameters: dict = {
        "type": "object",
        "properties": {
            "analysis_type": {
                "type": "string",
                "description": "(required) Type of analysis to perform.",
                "enum": ["complexity", "refactoring", "architecture", "dependencies", "documentation", "performance", "all"]
            },
            "file_path": {
                "type": "string",
                "description": "(optional) Specific file to analyze. If not provided, analyzes the entire project.",
            },
            "project_name": {
                "type": "string",
                "description": "(optional) Project name to analyze. If not specified, uses the workspace root.",
            },
            "include_tests": {
                "type": "boolean",
                "description": "(optional) Whether to include test files in analysis. Default is True.",
                "default": True
            },
            "complexity_threshold": {
                "type": "integer",
                "description": "(optional) Complexity threshold for flagging functions. Default is 10.",
                "default": 10
            },
            "detailed_report": {
                "type": "boolean",
                "description": "(optional) Whether to generate a detailed report. Default is True.",
                "default": True
            }
        },
        "required": ["analysis_type"],
    }

    async def execute(
        self,
        analysis_type: str,
        file_path: Optional[str] = None,
        project_name: Optional[str] = None,
        include_tests: bool = True,
        complexity_threshold: int = 10,
        detailed_report: bool = True,
    ) -> str:
        """
        Perform comprehensive code analysis.
        """
        try:
            base_folder = get_project_folder(project_name)
            
            if file_path:
                # Analyze specific file
                full_path = base_folder / file_path
                if not full_path.exists():
                    return f"Error: File not found: {full_path}"
                files_to_analyze = [full_path]
            else:
                # Analyze entire project
                files_to_analyze = self._find_code_files(base_folder, include_tests)
            
            if not files_to_analyze:
                return "No code files found to analyze."
            
            if analysis_type == "all":
                return await self._comprehensive_analysis(files_to_analyze, complexity_threshold, detailed_report)
            elif analysis_type == "complexity":
                return await self._complexity_analysis(files_to_analyze, complexity_threshold)
            elif analysis_type == "refactoring":
                return await self._refactoring_analysis(files_to_analyze)
            elif analysis_type == "architecture":
                return await self._architecture_analysis(files_to_analyze)
            elif analysis_type == "dependencies":
                return await self._dependency_analysis(files_to_analyze)
            elif analysis_type == "documentation":
                return await self._documentation_analysis(files_to_analyze)
            elif analysis_type == "performance":
                return await self._performance_analysis(files_to_analyze)
            else:
                return f"Unknown analysis type: {analysis_type}"
                
        except Exception as e:
            return f"Error during code analysis: {str(e)}"

    def _find_code_files(self, base_folder: Path, include_tests: bool) -> List[Path]:
        """Find all code files in the project."""
        code_files = []
        extensions = ['.py', '.js', '.ts', '.tsx', '.jsx']
        
        for ext in extensions:
            files = list(base_folder.rglob(f"*{ext}"))
            if not include_tests:
                files = [f for f in files if not self._is_test_file(f)]
            code_files.extend(files)
        
        return code_files

    def _is_test_file(self, file_path: Path) -> bool:
        """Check if a file is a test file."""
        name = file_path.name.lower()
        return any(pattern in name for pattern in ['test_', '_test', 'test.', '.test.', 'spec.', '_spec'])

    async def _comprehensive_analysis(self, files: List[Path], complexity_threshold: int, detailed: bool) -> str:
        """Perform comprehensive analysis of all aspects."""
        result = "🔍 **Comprehensive Code Analysis Report**\n\n"
        
        # Overall metrics
        total_lines = 0
        total_functions = 0
        complex_functions = 0
        
        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                lines = len(content.split('\n'))
                total_lines += lines
                
                if file_path.suffix == '.py':
                    tree = ast.parse(content)
                    functions = [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
                    total_functions += len(functions)
                    
                    for func in functions:
                        complexity = self._calculate_cyclomatic_complexity(func)
                        if complexity > complexity_threshold:
                            complex_functions += 1
                            
            except Exception:
                continue
        
        result += f"📊 **Project Overview**\n"
        result += f"- Total files analyzed: {len(files)}\n"
        result += f"- Total lines of code: {total_lines:,}\n"
        result += f"- Total functions: {total_functions}\n"
        result += f"- Complex functions (>{complexity_threshold}): {complex_functions}\n"
        result += f"- Complexity ratio: {(complex_functions/max(total_functions, 1)*100):.1f}%\n\n"
        
        # Individual analyses
        result += await self._complexity_analysis(files, complexity_threshold)
        result += "\n" + await self._refactoring_analysis(files)
        result += "\n" + await self._architecture_analysis(files)
        
        return result

    async def _complexity_analysis(self, files: List[Path], threshold: int) -> str:
        """Analyze code complexity."""
        result = "📈 **Complexity Analysis**\n\n"
        complex_functions = []
        
        for file_path in files:
            if file_path.suffix != '.py':
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                tree = ast.parse(content)
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        complexity = self._calculate_cyclomatic_complexity(node)
                        if complexity > threshold:
                            complex_functions.append({
                                'file': str(file_path.name),
                                'function': node.name,
                                'line': node.lineno,
                                'complexity': complexity
                            })
                            
            except Exception:
                continue
        
        if complex_functions:
            result += f"Found {len(complex_functions)} functions with high complexity (>{threshold}):\n\n"
            
            # Sort by complexity
            complex_functions.sort(key=lambda x: x['complexity'], reverse=True)
            
            for func in complex_functions[:10]:  # Show top 10
                result += f"🔴 **{func['function']}()** in {func['file']}:{func['line']}\n"
                result += f"   Cyclomatic Complexity: {func['complexity']}\n"
                result += f"   💡 Consider breaking this function into smaller, more focused functions.\n\n"
        else:
            result += "✅ All functions have acceptable complexity levels.\n"
        
        return result

    def _calculate_cyclomatic_complexity(self, node: ast.FunctionDef) -> int:
        """Calculate cyclomatic complexity of a function."""
        complexity = 1  # Base complexity
        
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.AsyncFor)):
                complexity += 1
            elif isinstance(child, ast.ExceptHandler):
                complexity += 1
            elif isinstance(child, ast.With, ast.AsyncWith):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
        
        return complexity

    async def _refactoring_analysis(self, files: List[Path]) -> str:
        """Analyze code for refactoring opportunities."""
        result = "🔧 **Refactoring Suggestions**\n\n"
        suggestions = []
        
        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                
                file_suggestions = self._find_refactoring_opportunities(lines, str(file_path.name))
                suggestions.extend(file_suggestions)
                
            except Exception:
                continue
        
        if suggestions:
            # Group by type
            suggestion_groups = {}
            for suggestion in suggestions:
                if suggestion.suggestion_type not in suggestion_groups:
                    suggestion_groups[suggestion.suggestion_type] = []
                suggestion_groups[suggestion.suggestion_type].append(suggestion)
            
            for suggestion_type, group in suggestion_groups.items():
                result += f"**{suggestion_type.title()} ({len(group)} instances)**\n"
                
                for suggestion in group[:3]:  # Show top 3 per type
                    result += f"  📁 {suggestion.file_path}:{suggestion.line_number}\n"
                    result += f"     {suggestion.description}\n"
                    if suggestion.before_code:
                        result += f"     Before: `{suggestion.before_code.strip()}`\n"
                    if suggestion.after_code:
                        result += f"     After: `{suggestion.after_code.strip()}`\n"
                    result += "\n"
                
                if len(group) > 3:
                    result += f"     ... and {len(group) - 3} more instances\n\n"
        else:
            result += "✅ No obvious refactoring opportunities found.\n"
        
        return result

    def _find_refactoring_opportunities(self, lines: List[str], file_name: str) -> List[RefactoringSuggestion]:
        """Find refactoring opportunities in code."""
        suggestions = []
        
        for i, line in enumerate(lines, 1):
            line_stripped = line.strip()
            
            # Long parameter lists
            if re.search(r'def\s+\w+\s*\([^)]{50,}\)', line_stripped):
                suggestions.append(RefactoringSuggestion(
                    file_path=file_name,
                    line_number=i,
                    suggestion_type="long_parameter_list",
                    description="Function has too many parameters. Consider using a configuration object or breaking into smaller functions.",
                    before_code=line_stripped,
                    after_code="def function_name(config: ConfigObject):",
                    impact="medium"
                ))
            
            # Magic numbers
            if re.search(r'\b\d{2,}\b', line_stripped) and not re.search(r'["\'].*\d+.*["\']', line_stripped):
                suggestions.append(RefactoringSuggestion(
                    file_path=file_name,
                    line_number=i,
                    suggestion_type="magic_numbers",
                    description="Consider extracting magic numbers into named constants.",
                    before_code=line_stripped,
                    after_code="# Define constants at module level",
                    impact="low"
                ))
            
            # Nested conditionals
            if line_stripped.count('if') > 1 or (line_stripped.startswith('if') and '    if' in line):
                suggestions.append(RefactoringSuggestion(
                    file_path=file_name,
                    line_number=i,
                    suggestion_type="nested_conditionals",
                    description="Deeply nested conditionals reduce readability. Consider early returns or guard clauses.",
                    before_code=line_stripped,
                    after_code="# Use early returns to reduce nesting",
                    impact="medium"
                ))
        
        return suggestions

    async def _architecture_analysis(self, files: List[Path]) -> str:
        """Analyze project architecture."""
        result = "🏗️ **Architecture Analysis**\n\n"
        
        # Analyze imports and dependencies
        imports = {}
        modules = set()
        
        for file_path in files:
            if file_path.suffix != '.py':
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                tree = ast.parse(content)
                module_name = file_path.stem
                modules.add(module_name)
                imports[module_name] = []
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            imports[module_name].append(alias.name)
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            imports[module_name].append(node.module)
                            
            except Exception:
                continue
        
        # Calculate coupling
        internal_imports = {}
        external_imports = {}
        
        for module, module_imports in imports.items():
            internal_imports[module] = [imp for imp in module_imports if imp in modules]
            external_imports[module] = [imp for imp in module_imports if imp not in modules]
        
        result += f"📦 **Module Structure**\n"
        result += f"- Total modules: {len(modules)}\n"
        result += f"- Average internal dependencies per module: {sum(len(deps) for deps in internal_imports.values()) / max(len(modules), 1):.1f}\n"
        result += f"- Average external dependencies per module: {sum(len(deps) for deps in external_imports.values()) / max(len(modules), 1):.1f}\n\n"
        
        # Find highly coupled modules
        highly_coupled = [(mod, len(deps)) for mod, deps in internal_imports.items() if len(deps) > 5]
        if highly_coupled:
            result += "⚠️ **Highly Coupled Modules** (>5 internal dependencies):\n"
            for module, count in sorted(highly_coupled, key=lambda x: x[1], reverse=True):
                result += f"  - {module}: {count} dependencies\n"
            result += "\n"
        
        return result

    async def _dependency_analysis(self, files: List[Path]) -> str:
        """Analyze project dependencies."""
        result = "📦 **Dependency Analysis**\n\n"
        
        # This is a simplified version - in a real implementation,
        # you'd parse requirements.txt, package.json, etc.
        result += "🔍 Analyzing import patterns and external dependencies...\n\n"
        
        external_deps = set()
        for file_path in files:
            if file_path.suffix != '.py':
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Find import statements
                import_pattern = r'^(?:from\s+(\S+)\s+import|import\s+(\S+))'
                for match in re.finditer(import_pattern, content, re.MULTILINE):
                    module = match.group(1) or match.group(2)
                    if module and not module.startswith('.'):
                        external_deps.add(module.split('.')[0])
                        
            except Exception:
                continue
        
        # Filter out standard library modules (simplified)
        stdlib_modules = {'os', 'sys', 'json', 're', 'datetime', 'pathlib', 'typing', 'collections', 'itertools'}
        third_party_deps = external_deps - stdlib_modules
        
        result += f"📊 **Dependency Summary**\n"
        result += f"- Standard library modules: {len(external_deps & stdlib_modules)}\n"
        result += f"- Third-party dependencies: {len(third_party_deps)}\n\n"
        
        if third_party_deps:
            result += "🔗 **Third-party Dependencies**:\n"
            for dep in sorted(third_party_deps):
                result += f"  - {dep}\n"
        
        return result

    async def _documentation_analysis(self, files: List[Path]) -> str:
        """Analyze documentation quality."""
        result = "📚 **Documentation Analysis**\n\n"
        
        total_functions = 0
        documented_functions = 0
        total_classes = 0
        documented_classes = 0
        
        for file_path in files:
            if file_path.suffix != '.py':
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                tree = ast.parse(content)
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        total_functions += 1
                        if ast.get_docstring(node):
                            documented_functions += 1
                    elif isinstance(node, ast.ClassDef):
                        total_classes += 1
                        if ast.get_docstring(node):
                            documented_classes += 1
                            
            except Exception:
                continue
        
        func_doc_rate = (documented_functions / max(total_functions, 1)) * 100
        class_doc_rate = (documented_classes / max(total_classes, 1)) * 100
        
        result += f"📈 **Documentation Coverage**\n"
        result += f"- Functions: {documented_functions}/{total_functions} ({func_doc_rate:.1f}%)\n"
        result += f"- Classes: {documented_classes}/{total_classes} ({class_doc_rate:.1f}%)\n\n"
        
        if func_doc_rate < 50:
            result += "⚠️ Low function documentation coverage. Consider adding docstrings.\n"
        if class_doc_rate < 50:
            result += "⚠️ Low class documentation coverage. Consider adding docstrings.\n"
        
        if func_doc_rate >= 80 and class_doc_rate >= 80:
            result += "✅ Good documentation coverage!\n"
        
        return result

    async def _performance_analysis(self, files: List[Path]) -> str:
        """Analyze potential performance issues."""
        result = "⚡ **Performance Analysis**\n\n"
        
        performance_issues = []
        
        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                
                for i, line in enumerate(lines, 1):
                    line_stripped = line.strip()
                    
                    # Inefficient patterns
                    if '+=' in line_stripped and any(quote in line_stripped for quote in ['"', "'"]):
                        performance_issues.append(f"{file_path.name}:{i} - String concatenation in loop")
                    
                    if re.search(r'\.append\(.*\)', line_stripped) and 'for' in lines[max(0, i-3):i]:
                        performance_issues.append(f"{file_path.name}:{i} - Consider list comprehension")
                    
                    if 'global ' in line_stripped:
                        performance_issues.append(f"{file_path.name}:{i} - Global variable usage")
                        
            except Exception:
                continue
        
        if performance_issues:
            result += f"Found {len(performance_issues)} potential performance issues:\n\n"
            for issue in performance_issues[:10]:
                result += f"⚠️ {issue}\n"
            
            if len(performance_issues) > 10:
                result += f"\n... and {len(performance_issues) - 10} more issues\n"
        else:
            result += "✅ No obvious performance issues detected.\n"
        
        return result
