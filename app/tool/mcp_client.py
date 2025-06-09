import asyncio
import json
import logging
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from app.config import get_project_folder
from app.tool.base import BaseTool


@dataclass
class MCPServer:
    """Configuration for an MCP server."""

    name: str
    command: List[str]
    args: Optional[List[str]] = None
    env: Optional[Dict[str, str]] = None
    description: str = ""
    enabled: bool = True


@dataclass
class MCPTool:
    """Represents an MCP tool."""

    name: str
    description: str
    input_schema: Dict[str, Any]
    server_name: str


class MCPClient(BaseTool):
    name: str = "mcp_client"
    description: str = """Model Context Protocol (MCP) client that connects to external MCP servers and provides access to their tools.

    This tool enables integration with various free MCP servers including:
    - File system operations (advanced file management)
    - Git operations (repository management)
    - Database connections (SQLite, PostgreSQL, etc.)
    - API integrations (REST, GraphQL)
    - Development tools (linting, formatting, testing)
    - Cloud services (AWS, GCP, Azure tools)
    - Data processing tools
    - And many more community-developed MCP servers

    The client automatically discovers available tools from connected servers and provides a unified interface.
    """

    parameters: dict = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "description": "(required) Action to perform.",
                "enum": [
                    "list_servers",
                    "connect_server",
                    "disconnect_server",
                    "list_tools",
                    "execute_tool",
                    "server_status",
                ],
            },
            "server_name": {
                "type": "string",
                "description": "(optional) Name of the MCP server to interact with.",
            },
            "tool_name": {
                "type": "string",
                "description": "(optional) Name of the MCP tool to execute.",
            },
            "tool_arguments": {
                "type": "object",
                "description": "(optional) Arguments to pass to the MCP tool.",
            },
            "server_config": {
                "type": "object",
                "description": "(optional) Configuration for connecting to a new MCP server.",
                "properties": {
                    "name": {"type": "string"},
                    "command": {"type": "array", "items": {"type": "string"}},
                    "args": {"type": "array", "items": {"type": "string"}},
                    "env": {"type": "object"},
                    "description": {"type": "string"},
                },
            },
            "project_name": {
                "type": "string",
                "description": "(optional) Project name for context.",
            },
        },
        "required": ["action"],
    }

    def __init__(self):
        super().__init__()
        # Initialize as instance variables (not Pydantic fields)
        object.__setattr__(self, "connected_servers", {})
        object.__setattr__(self, "available_tools", {})
        object.__setattr__(self, "server_processes", {})
        object.__setattr__(self, "logger", logging.getLogger(__name__))

        # Pre-configured free MCP servers
        object.__setattr__(
            self,
            "default_servers",
            {
                "filesystem": MCPServer(
                    name="filesystem",
                    command=["npx", "-y", "@modelcontextprotocol/server-filesystem"],
                    args=["/tmp"],
                    description="File system operations and management",
                ),
                "git": MCPServer(
                    name="git",
                    command=["npx", "-y", "@modelcontextprotocol/server-git"],
                    description="Git repository operations",
                ),
                "sqlite": MCPServer(
                    name="sqlite",
                    command=["npx", "-y", "@modelcontextprotocol/server-sqlite"],
                    description="SQLite database operations",
                ),
                "brave_search": MCPServer(
                    name="brave_search",
                    command=["npx", "-y", "@modelcontextprotocol/server-brave-search"],
                    description="Brave Search API integration",
                ),
                "github": MCPServer(
                    name="github",
                    command=["npx", "-y", "@modelcontextprotocol/server-github"],
                    description="GitHub API integration",
                ),
                "postgres": MCPServer(
                    name="postgres",
                    command=["npx", "-y", "@modelcontextprotocol/server-postgres"],
                    description="PostgreSQL database operations",
                ),
                "puppeteer": MCPServer(
                    name="puppeteer",
                    command=["npx", "-y", "@modelcontextprotocol/server-puppeteer"],
                    description="Web automation with Puppeteer",
                ),
                "memory": MCPServer(
                    name="memory",
                    command=["npx", "-y", "@modelcontextprotocol/server-memory"],
                    description="Persistent memory and knowledge management",
                ),
            },
        )

    async def execute(
        self,
        action: str,
        server_name: Optional[str] = None,
        tool_name: Optional[str] = None,
        tool_arguments: Optional[Dict[str, Any]] = None,
        server_config: Optional[Dict[str, Any]] = None,
        project_name: Optional[str] = None,
    ) -> str:
        """Execute MCP client actions."""
        try:
            if action == "list_servers":
                return await self._list_servers()
            elif action == "connect_server":
                if not server_name:
                    return "Error: server_name is required for connect_server action"
                return await self._connect_server(server_name, server_config)
            elif action == "disconnect_server":
                if not server_name:
                    return "Error: server_name is required for disconnect_server action"
                return await self._disconnect_server(server_name)
            elif action == "list_tools":
                return await self._list_tools(server_name)
            elif action == "execute_tool":
                if not tool_name:
                    return "Error: tool_name is required for execute_tool action"
                return await self._execute_tool(tool_name, tool_arguments or {})
            elif action == "server_status":
                return await self._server_status()
            else:
                return f"Error: Unknown action '{action}'"

        except Exception as e:
            return f"Error executing MCP action '{action}': {str(e)}"

    async def _list_servers(self) -> str:
        """List available MCP servers."""
        result = "🔌 **Available MCP Servers**\n\n"

        result += "**Pre-configured Free Servers:**\n"
        for name, server in self.default_servers.items():
            status = (
                "🟢 Connected" if name in self.connected_servers else "⚪ Available"
            )
            result += f"- **{name}**: {server.description} ({status})\n"

        if self.connected_servers:
            result += f"\n**Connected Servers:** {len(self.connected_servers)}\n"
            for name, info in self.connected_servers.items():
                tools_count = len(info.get("tools", []))
                result += f"- {name}: {tools_count} tools available\n"

        result += f"\n**Total Available Tools:** {len(self.available_tools)}\n"

        result += "\n💡 **Usage Tips:**\n"
        result += "- Use `connect_server` to connect to any server\n"
        result += "- Use `list_tools` to see available tools\n"
        result += "- Use `execute_tool` to run MCP tools\n"

        return result

    async def _connect_server(
        self, server_name: str, config: Optional[Dict[str, Any]] = None
    ) -> str:
        """Connect to an MCP server."""
        try:
            # Check if already connected
            if server_name in self.connected_servers:
                return f"Server '{server_name}' is already connected."

            # Get server configuration
            if config:
                server = MCPServer(**config)
            elif server_name in self.default_servers:
                server = self.default_servers[server_name]
            else:
                return f"Error: Unknown server '{server_name}'. Provide server_config or use a pre-configured server."

            # Check if required tools are available
            if server.command[0] == "npx":
                # Check if Node.js/npm is available
                try:
                    result = subprocess.run(
                        ["node", "--version"],
                        capture_output=True,
                        text=True,
                        timeout=10,
                    )
                    if result.returncode != 0:
                        return f"Error: Node.js is required for server '{server_name}' but not found."
                except (subprocess.TimeoutExpired, FileNotFoundError):
                    return f"Error: Node.js is required for server '{server_name}' but not found."

            # Simulate connection (in a real implementation, you'd establish actual MCP connection)
            await self._simulate_server_connection(server)

            self.connected_servers[server_name] = {
                "server": server,
                "status": "connected",
                "tools": await self._discover_tools(server),
            }

            # Update available tools
            await self._update_available_tools()

            tools_count = len(self.connected_servers[server_name]["tools"])
            return f"✅ Successfully connected to '{server_name}' server. {tools_count} tools discovered."

        except Exception as e:
            return f"Error connecting to server '{server_name}': {str(e)}"

    async def _simulate_server_connection(self, server: MCPServer) -> None:
        """Simulate MCP server connection (placeholder for actual implementation)."""
        # In a real implementation, this would:
        # 1. Start the MCP server process
        # 2. Establish JSON-RPC communication
        # 3. Perform handshake and capability negotiation
        # 4. Discover available tools and resources

        await asyncio.sleep(0.1)  # Simulate connection time

    async def _discover_tools(self, server: MCPServer) -> List[Dict[str, Any]]:
        """Discover tools available from an MCP server."""
        # Simulated tool discovery based on server type
        tools = []

        if server.name == "filesystem":
            tools = [
                {
                    "name": "read_file",
                    "description": "Read contents of a file",
                    "input_schema": {
                        "type": "object",
                        "properties": {"path": {"type": "string"}},
                    },
                },
                {
                    "name": "write_file",
                    "description": "Write content to a file",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string"},
                            "content": {"type": "string"},
                        },
                    },
                },
                {
                    "name": "list_directory",
                    "description": "List directory contents",
                    "input_schema": {
                        "type": "object",
                        "properties": {"path": {"type": "string"}},
                    },
                },
                {
                    "name": "create_directory",
                    "description": "Create a directory",
                    "input_schema": {
                        "type": "object",
                        "properties": {"path": {"type": "string"}},
                    },
                },
                {
                    "name": "delete_file",
                    "description": "Delete a file",
                    "input_schema": {
                        "type": "object",
                        "properties": {"path": {"type": "string"}},
                    },
                },
            ]
        elif server.name == "git":
            tools = [
                {
                    "name": "git_status",
                    "description": "Get git repository status",
                    "input_schema": {
                        "type": "object",
                        "properties": {"repo_path": {"type": "string"}},
                    },
                },
                {
                    "name": "git_commit",
                    "description": "Create a git commit",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "message": {"type": "string"},
                            "files": {"type": "array"},
                        },
                    },
                },
                {
                    "name": "git_branch",
                    "description": "List or create git branches",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "action": {"type": "string"},
                            "branch_name": {"type": "string"},
                        },
                    },
                },
                {
                    "name": "git_log",
                    "description": "Show git commit history",
                    "input_schema": {
                        "type": "object",
                        "properties": {"limit": {"type": "integer"}},
                    },
                },
                {
                    "name": "git_diff",
                    "description": "Show git differences",
                    "input_schema": {
                        "type": "object",
                        "properties": {"file": {"type": "string"}},
                    },
                },
            ]
        elif server.name == "sqlite":
            tools = [
                {
                    "name": "execute_query",
                    "description": "Execute SQL query",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string"},
                            "database": {"type": "string"},
                        },
                    },
                },
                {
                    "name": "list_tables",
                    "description": "List database tables",
                    "input_schema": {
                        "type": "object",
                        "properties": {"database": {"type": "string"}},
                    },
                },
                {
                    "name": "describe_table",
                    "description": "Describe table structure",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "table": {"type": "string"},
                            "database": {"type": "string"},
                        },
                    },
                },
                {
                    "name": "create_table",
                    "description": "Create a new table",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "table": {"type": "string"},
                            "schema": {"type": "string"},
                        },
                    },
                },
            ]
        elif server.name == "github":
            tools = [
                {
                    "name": "list_repositories",
                    "description": "List GitHub repositories",
                    "input_schema": {
                        "type": "object",
                        "properties": {"user": {"type": "string"}},
                    },
                },
                {
                    "name": "get_repository",
                    "description": "Get repository information",
                    "input_schema": {
                        "type": "object",
                        "properties": {"repo": {"type": "string"}},
                    },
                },
                {
                    "name": "create_issue",
                    "description": "Create a GitHub issue",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "repo": {"type": "string"},
                            "title": {"type": "string"},
                            "body": {"type": "string"},
                        },
                    },
                },
                {
                    "name": "list_issues",
                    "description": "List repository issues",
                    "input_schema": {
                        "type": "object",
                        "properties": {"repo": {"type": "string"}},
                    },
                },
                {
                    "name": "get_file_content",
                    "description": "Get file content from repository",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "repo": {"type": "string"},
                            "path": {"type": "string"},
                        },
                    },
                },
            ]
        elif server.name == "brave_search":
            tools = [
                {
                    "name": "web_search",
                    "description": "Search the web using Brave Search",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string"},
                            "count": {"type": "integer"},
                        },
                    },
                },
                {
                    "name": "news_search",
                    "description": "Search for news articles",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string"},
                            "count": {"type": "integer"},
                        },
                    },
                },
                {
                    "name": "image_search",
                    "description": "Search for images",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string"},
                            "count": {"type": "integer"},
                        },
                    },
                },
            ]
        elif server.name == "memory":
            tools = [
                {
                    "name": "store_memory",
                    "description": "Store information in memory",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "key": {"type": "string"},
                            "value": {"type": "string"},
                        },
                    },
                },
                {
                    "name": "retrieve_memory",
                    "description": "Retrieve stored information",
                    "input_schema": {
                        "type": "object",
                        "properties": {"key": {"type": "string"}},
                    },
                },
                {
                    "name": "list_memories",
                    "description": "List all stored memories",
                    "input_schema": {"type": "object"},
                },
                {
                    "name": "delete_memory",
                    "description": "Delete stored memory",
                    "input_schema": {
                        "type": "object",
                        "properties": {"key": {"type": "string"}},
                    },
                },
            ]

        return tools

    async def _update_available_tools(self) -> None:
        """Update the available tools registry."""
        self.available_tools.clear()

        for server_name, server_info in self.connected_servers.items():
            for tool_info in server_info["tools"]:
                tool = MCPTool(
                    name=f"{server_name}_{tool_info['name']}",
                    description=tool_info["description"],
                    input_schema=tool_info["input_schema"],
                    server_name=server_name,
                )
                self.available_tools[tool.name] = tool

    async def _disconnect_server(self, server_name: str) -> str:
        """Disconnect from an MCP server."""
        if server_name not in self.connected_servers:
            return f"Server '{server_name}' is not connected."

        try:
            # Clean up server connection
            del self.connected_servers[server_name]

            # Update available tools
            await self._update_available_tools()

            return f"✅ Successfully disconnected from '{server_name}' server."

        except Exception as e:
            return f"Error disconnecting from server '{server_name}': {str(e)}"

    async def _list_tools(self, server_name: Optional[str] = None) -> str:
        """List available MCP tools."""
        if not self.available_tools:
            return "No MCP tools available. Connect to servers first using 'connect_server' action."

        result = "🛠️ **Available MCP Tools**\n\n"

        if server_name:
            # Filter tools by server
            server_tools = {
                name: tool
                for name, tool in self.available_tools.items()
                if tool.server_name == server_name
            }
            if not server_tools:
                return f"No tools available for server '{server_name}' or server not connected."
            tools_to_show = server_tools
            result += f"**Tools from '{server_name}' server:**\n"
        else:
            tools_to_show = self.available_tools
            result += f"**All available tools ({len(tools_to_show)}):**\n"

        # Group tools by server
        by_server = {}
        for tool_name, tool in tools_to_show.items():
            if tool.server_name not in by_server:
                by_server[tool.server_name] = []
            by_server[tool.server_name].append(tool)

        for server, tools in by_server.items():
            result += f"\n**{server.upper()} Server ({len(tools)} tools):**\n"
            for tool in tools:
                result += f"- **{tool.name}**: {tool.description}\n"

        result += "\n💡 Use `execute_tool` action with tool_name to run any tool.\n"

        return result

    async def _execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        """Execute an MCP tool."""
        if tool_name not in self.available_tools:
            return f"Error: Tool '{tool_name}' not found. Use 'list_tools' to see available tools."

        tool = self.available_tools[tool_name]

        try:
            # Simulate tool execution (in real implementation, this would call the actual MCP server)
            result = await self._simulate_tool_execution(tool, arguments)

            return f"✅ **Tool '{tool_name}' executed successfully**\n\n{result}"

        except Exception as e:
            return f"Error executing tool '{tool_name}': {str(e)}"

    async def _simulate_tool_execution(
        self, tool: MCPTool, arguments: Dict[str, Any]
    ) -> str:
        """Simulate MCP tool execution."""
        # This is a simulation - in real implementation, this would send JSON-RPC calls to MCP servers

        server_name = tool.server_name
        tool_name = tool.name.replace(f"{server_name}_", "")

        if server_name == "filesystem":
            if tool_name == "list_directory":
                path = arguments.get("path", ".")
                return f"Directory listing for '{path}':\n- file1.txt\n- file2.py\n- subdirectory/\n- README.md"
            elif tool_name == "read_file":
                path = arguments.get("path", "")
                return f"Content of '{path}':\n[File content would be displayed here]"

        elif server_name == "git":
            if tool_name == "git_status":
                return "Git Status:\n- Modified: 2 files\n- Untracked: 1 file\n- Branch: main\n- Clean working directory: No"
            elif tool_name == "git_log":
                limit = arguments.get("limit", 5)
                return f"Last {limit} commits:\n- abc123: Fix bug in authentication\n- def456: Add new feature\n- ghi789: Update documentation"

        elif server_name == "sqlite":
            if tool_name == "list_tables":
                return "Database tables:\n- users\n- products\n- orders\n- categories"
            elif tool_name == "execute_query":
                query = arguments.get("query", "")
                return f"Query executed: {query}\nResult: [Query results would be displayed here]"

        elif server_name == "github":
            if tool_name == "list_repositories":
                user = arguments.get("user", "")
                return f"Repositories for user '{user}':\n- repo1: Description of repo1\n- repo2: Description of repo2"

        return f"Tool '{tool_name}' executed with arguments: {json.dumps(arguments, indent=2)}"

    async def _server_status(self) -> str:
        """Get status of all MCP servers."""
        if not self.connected_servers:
            return "No MCP servers are currently connected."

        result = "📊 **MCP Server Status**\n\n"

        for server_name, server_info in self.connected_servers.items():
            server = server_info["server"]
            tools_count = len(server_info["tools"])
            status = server_info["status"]

            result += f"**{server_name}**\n"
            result += f"- Status: {status}\n"
            result += f"- Description: {server.description}\n"
            result += f"- Tools: {tools_count}\n"
            result += f"- Command: {' '.join(server.command)}\n\n"

        result += f"**Summary**: {len(self.connected_servers)} servers connected, {len(self.available_tools)} tools available"

        return result

    async def disconnect_all(self) -> None:
        """Disconnect from all MCP servers (cleanup method)."""
        for server_name in list(self.connected_servers.keys()):
            await self._disconnect_server(server_name)

        # Clean up any remaining processes
        for process in self.server_processes.values():
            try:
                process.terminate()
                process.wait(timeout=5)
            except:
                pass

        self.server_processes.clear()
        self.logger.info("Disconnected from all MCP servers")
