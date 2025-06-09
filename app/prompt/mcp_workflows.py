"""
MCP Workflow Examples for Manus Agent

This module contains example workflows that demonstrate how to effectively
combine MCP external tools with built-in code analysis capabilities.
"""

MCP_WORKFLOW_EXAMPLES = """
## Example MCP-Enhanced Workflows

### 1. Comprehensive Project Analysis Workflow
```
1. Use CodebaseSearch to understand project structure
2. Use MCPManager to validate and configure relevant servers (filesystem, git, sqlite)
3. Use MCPClient to connect to filesystem server for advanced file operations
4. Use MCPClient to connect to git server for repository analysis
5. Use CodeAnalyzer for code quality assessment
6. Use CodeDebugger for issue identification
7. Use TestGenerator for test coverage analysis
8. Combine results for comprehensive project report
```

### 2. Development Environment Setup Workflow
```
1. Use MCPManager to browse available community servers
2. Use MCPManager to validate prerequisites (Node.js, API keys)
3. Use MCPClient to connect to essential servers (filesystem, git, memory)
4. Use MCPClient to test external tool functionality
5. Use CodebaseSearch to understand existing project patterns
6. Configure project-specific MCP servers based on technology stack
7. Document the setup for team collaboration
```

### 3. Code Quality Enhancement Workflow
```
1. Use CodebaseSearch to identify code patterns and architecture
2. Use CodeDebugger to find issues and vulnerabilities
3. Use MCPClient with git server to analyze commit history and changes
4. Use CodeAnalyzer for complexity and maintainability metrics
5. Use MCPClient with database servers to analyze data layer quality
6. Use TestGenerator to create comprehensive test suites
7. Provide prioritized improvement recommendations
```

### 4. External Integration Workflow
```
1. Use MCPManager to identify relevant community servers for the task
2. Use MCPManager to configure authentication and prerequisites
3. Use MCPClient to connect to specialized servers (GitHub, APIs, cloud services)
4. Combine external capabilities with built-in analysis tools
5. Create automated workflows using external tool combinations
6. Document integration patterns for reuse
```

### 5. Database Development Workflow
```
1. Use MCPClient to connect to SQLite/PostgreSQL servers
2. Use external database tools to analyze schema and data
3. Use CodebaseSearch to find database-related code patterns
4. Use CodeDebugger to identify database-related issues
5. Use TestGenerator to create database test cases
6. Combine database analysis with code quality assessment
```
"""

MCP_BEST_PRACTICES = """
## MCP Integration Best Practices for Manus

### Server Selection Strategy
- **Filesystem Server**: For advanced file operations, directory analysis, file watching
- **Git Server**: For repository analysis, commit history, branch management
- **Database Servers**: For schema analysis, query optimization, data validation
- **Memory Server**: For persistent knowledge storage across sessions
- **API Servers**: For external service integration and data retrieval
- **Automation Servers**: For web scraping, testing, deployment automation

### Workflow Optimization
1. **Start with MCPManager**: Always validate configurations before connecting
2. **Connect Strategically**: Only connect to servers needed for the current task
3. **Combine Capabilities**: Use external tools to enhance built-in analysis
4. **Cache Results**: Use memory server to store analysis results for reuse
5. **Document Patterns**: Create reusable workflow templates

### Error Handling and Fallbacks
- Always provide fallback options when external servers are unavailable
- Use built-in tools as primary capabilities, MCP as enhancements
- Validate server connectivity before attempting complex workflows
- Provide clear error messages and alternative approaches

### Performance Considerations
- Connect to MCP servers only when needed
- Disconnect from unused servers to free resources
- Use parallel execution when possible for independent operations
- Cache frequently accessed external tool results
"""

def get_mcp_workflow_for_task(task_type: str) -> str:
    """Get recommended MCP workflow for a specific task type."""
    workflows = {
        "code_analysis": """
1. Use CodebaseSearch to understand project structure
2. Use MCPClient to connect to filesystem server for file analysis
3. Use CodeAnalyzer for quality metrics
4. Use CodeDebugger for issue detection
5. Combine results for comprehensive analysis
        """,
        
        "project_setup": """
1. Use MCPManager to validate available servers
2. Use MCPClient to connect to git server for repository setup
3. Use MCPClient to connect to filesystem server for project structure
4. Use CodebaseSearch to understand existing patterns
5. Configure project-specific external tools
        """,
        
        "debugging": """
1. Use CodeDebugger to identify issues
2. Use MCPClient with git server to analyze recent changes
3. Use CodebaseSearch to find related code patterns
4. Use external database tools if data-related issues
5. Provide comprehensive debugging report
        """,
        
        "testing": """
1. Use CodebaseSearch to identify testable components
2. Use TestGenerator to create test cases
3. Use MCPClient with filesystem server for test file management
4. Use CodeAnalyzer to assess test coverage
5. Generate comprehensive testing strategy
        """,
        
        "refactoring": """
1. Use CodeAnalyzer to identify refactoring opportunities
2. Use CodebaseSearch to understand code dependencies
3. Use MCPClient with git server to analyze change impact
4. Use TestGenerator to ensure refactoring safety
5. Provide step-by-step refactoring plan
        """
    }
    
    return workflows.get(task_type, workflows["code_analysis"])
