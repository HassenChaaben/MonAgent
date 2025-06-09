# 🚀 Enhanced Manus Agent - Complete Setup Guide

## ✅ **Immediate Use (Ready Now)**

Your enhanced Manus agent is ready with these capabilities:

### **1. Advanced Code Analysis Tools**
- **CodebaseSearch**: Search for functions, classes, patterns across your codebase
- **CodeDebugger**: Identify bugs, security issues, and performance problems
- **CodeAnalyzer**: Comprehensive code quality assessment and refactoring suggestions
- **TestGenerator**: Generate comprehensive test suites with edge cases

### **2. Basic MCP Functionality**
- **MCPManager**: Configure and manage MCP server connections
- **MCPClient**: Connect to and use external MCP tools (simulation mode)

## 🛠️ **Enhanced Functionality Setup**

### **Step 1: Install Node.js (Required for Real MCP Servers)**

1. **Download Node.js LTS**:
   - Visit: https://nodejs.org/en/download
   - Download the "LTS" version for Windows
   - Run the installer and follow the setup wizard

2. **Verify Installation**:
   ```bash
   node --version
   npm --version
   ```

3. **Test MCP Server Access**:
   ```bash
   npx --version
   ```

### **Step 2: Configure API Keys (Optional but Recommended)**

#### **GitHub Integration**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:user`, `read:org`
4. Copy the token
5. Set environment variable:
   ```bash
   # Windows Command Prompt
   set GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
   
   # Windows PowerShell
   $env:GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"
   ```

#### **Brave Search API (Free)**
1. Visit: https://api.search.brave.com/
2. Sign up for a free account
3. Get your API key
4. Set environment variable:
   ```bash
   # Windows Command Prompt
   set BRAVE_API_KEY=your_api_key_here
   
   # Windows PowerShell
   $env:BRAVE_API_KEY="your_api_key_here"
   ```

### **Step 3: Test Real MCP Servers**

Once Node.js is installed, you can test real MCP servers:

#### **Test Filesystem Server**
```bash
npx -y @modelcontextprotocol/server-filesystem
```

#### **Test Git Server**
```bash
npx -y @modelcontextprotocol/server-git
```

#### **Test SQLite Server**
```bash
npx -y @modelcontextprotocol/server-sqlite
```

## 🎯 **Usage Examples**

### **Immediate Use (No Setup Required)**

#### **Code Analysis**
```
"Search for all authentication functions in the codebase"
"Analyze the project for security vulnerabilities"
"Generate tests for the user authentication module"
"Perform a complexity analysis of the main application"
```

#### **MCP Management**
```
"List all available MCP server configurations"
"Browse community MCP servers"
"Validate the filesystem server configuration"
"Connect to the memory MCP server"
```

### **After Node.js Setup**

#### **Real MCP Server Usage**
```
"Connect to the real filesystem MCP server and list the current directory"
"Use the git MCP server to check repository status"
"Connect to SQLite server and list available databases"
"Use the memory server to store project information"
```

#### **Advanced Integrations**
```
"Set up GitHub integration and list my repositories"
"Use Brave Search to find documentation for this technology"
"Connect to PostgreSQL and analyze database schema"
"Use Puppeteer to automate web testing"
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **"Node.js not found"**
   - Install Node.js from nodejs.org
   - Restart your terminal/IDE after installation

2. **"Permission denied" errors**
   - Run terminal as administrator
   - Or use: `npx --yes` instead of `npx -y`

3. **"API key not working"**
   - Verify the environment variable is set
   - Restart the application after setting variables

4. **"MCP server connection failed"**
   - Check internet connection
   - Verify the server package exists
   - Try updating npm: `npm install -g npm@latest`

### **Validation Commands**

Test your setup with these commands in the chat:

```
"Use mcp_manager to validate all server configurations"
"Use mcp_client to check server status"
"Test the codebase_search tool on this project"
"Use code_debugger to analyze a sample Python file"
```

## 🌟 **Available MCP Servers**

### **Free Servers (No API Key Required)**
- **@modelcontextprotocol/server-filesystem** - File operations
- **@modelcontextprotocol/server-git** - Git repository management
- **@modelcontextprotocol/server-sqlite** - SQLite database operations
- **@modelcontextprotocol/server-memory** - Persistent memory
- **@modelcontextprotocol/server-fetch** - HTTP requests
- **@modelcontextprotocol/server-puppeteer** - Web automation

### **API Key Required**
- **@modelcontextprotocol/server-github** - GitHub integration
- **@modelcontextprotocol/server-brave-search** - Web search
- **@modelcontextprotocol/server-postgres** - PostgreSQL operations

### **Community Servers**
- **mcp-server-docker** - Docker management
- **mcp-server-kubernetes** - Kubernetes operations
- **mcp-server-aws** - AWS cloud services
- **mcp-server-slack** - Slack integration
- **mcp-server-notion** - Notion workspace

## 🎉 **Next Steps**

1. **Start with immediate use** - Test the code analysis tools
2. **Install Node.js** - Enable real MCP server connections
3. **Configure API keys** - Unlock authenticated services
4. **Explore community servers** - Expand capabilities further
5. **Create custom workflows** - Combine tools for complex tasks

Your enhanced Manus agent is now a powerful development companion with access to both advanced built-in tools and a vast ecosystem of external capabilities!
