import json
import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.config import get_project_folder
from app.tool.base import BaseTool


@dataclass
class MCPServerConfig:
    """MCP Server configuration."""

    name: str
    command: List[str]
    args: Optional[List[str]] = None
    env: Optional[Dict[str, str]] = None
    description: str = ""
    enabled: bool = True
    auto_connect: bool = False
    category: str = "general"


class MCPManager(BaseTool):
    name: str = "mcp_manager"
    description: str = """MCP (Model Context Protocol) configuration manager for managing external tool integrations.

    This tool helps you configure and manage MCP servers that provide external tools and capabilities:
    - Configure free MCP servers (filesystem, git, databases, APIs)
    - Manage server connections and settings
    - Save and load MCP configurations
    - Browse available community MCP servers
    - Set up authentication and environment variables
    - Enable/disable servers and auto-connection

    Popular free MCP servers include:
    - @modelcontextprotocol/server-filesystem (file operations)
    - @modelcontextprotocol/server-git (git operations)
    - @modelcontextprotocol/server-sqlite (database operations)
    - @modelcontextprotocol/server-github (GitHub integration)
    - @modelcontextprotocol/server-brave-search (web search)
    - @modelcontextprotocol/server-memory (persistent memory)
    """

    parameters: dict = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "description": "(required) Management action to perform.",
                "enum": [
                    "list_configs",
                    "add_server",
                    "remove_server",
                    "update_server",
                    "save_config",
                    "load_config",
                    "browse_servers",
                    "validate_config",
                    "export_config",
                    "import_config",
                ],
            },
            "server_name": {
                "type": "string",
                "description": "(optional) Name of the MCP server to manage.",
            },
            "server_config": {
                "type": "object",
                "description": "(optional) Server configuration object.",
                "properties": {
                    "name": {"type": "string"},
                    "command": {"type": "array", "items": {"type": "string"}},
                    "args": {"type": "array", "items": {"type": "string"}},
                    "env": {"type": "object"},
                    "description": {"type": "string"},
                    "enabled": {"type": "boolean"},
                    "auto_connect": {"type": "boolean"},
                    "category": {"type": "string"},
                },
            },
            "config_file": {
                "type": "string",
                "description": "(optional) Configuration file path for save/load operations.",
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
        object.__setattr__(self, "config_file", "mcp_config.json")
        object.__setattr__(self, "servers", {})
        self._load_default_servers()

    def _load_default_servers(self):
        """Load default free MCP server configurations."""
        default_servers = [
            MCPServerConfig(
                name="filesystem",
                command=["npx", "-y", "@modelcontextprotocol/server-filesystem"],
                args=[],
                description="Advanced file system operations and management",
                category="file_management",
                auto_connect=True,
            ),
            MCPServerConfig(
                name="git",
                command=["npx", "-y", "@modelcontextprotocol/server-git"],
                description="Git repository operations and version control",
                category="development",
                auto_connect=True,
            ),
            MCPServerConfig(
                name="sqlite",
                command=["npx", "-y", "@modelcontextprotocol/server-sqlite"],
                description="SQLite database operations and queries",
                category="database",
            ),
            MCPServerConfig(
                name="github",
                command=["npx", "-y", "@modelcontextprotocol/server-github"],
                env={"GITHUB_PERSONAL_ACCESS_TOKEN": ""},
                description="GitHub API integration for repository management",
                category="development",
            ),
            MCPServerConfig(
                name="brave_search",
                command=["npx", "-y", "@modelcontextprotocol/server-brave-search"],
                env={"BRAVE_API_KEY": ""},
                description="Brave Search API for web search capabilities",
                category="search",
            ),
            MCPServerConfig(
                name="postgres",
                command=["npx", "-y", "@modelcontextprotocol/server-postgres"],
                env={"POSTGRES_CONNECTION_STRING": ""},
                description="PostgreSQL database operations",
                category="database",
            ),
            MCPServerConfig(
                name="puppeteer",
                command=["npx", "-y", "@modelcontextprotocol/server-puppeteer"],
                description="Web automation and scraping with Puppeteer",
                category="automation",
            ),
            MCPServerConfig(
                name="memory",
                command=["npx", "-y", "@modelcontextprotocol/server-memory"],
                description="Persistent memory and knowledge management",
                category="memory",
                auto_connect=True,
            ),
            MCPServerConfig(
                name="fetch",
                command=["npx", "-y", "@modelcontextprotocol/server-fetch"],
                description="HTTP requests and API interactions",
                category="network",
            ),
            MCPServerConfig(
                name="everything",
                command=["npx", "-y", "@modelcontextprotocol/server-everything"],
                description="Windows Everything search integration",
                category="search",
                enabled=False,  # Windows-specific
            ),
        ]

        for server in default_servers:
            self.servers[server.name] = server

    async def execute(
        self,
        action: str,
        server_name: Optional[str] = None,
        server_config: Optional[Dict[str, Any]] = None,
        config_file: Optional[str] = None,
        project_name: Optional[str] = None,
    ) -> str:
        """Execute MCP management actions."""
        try:
            if action == "list_configs":
                return await self._list_configs()
            elif action == "add_server":
                if not server_config:
                    return "Error: server_config is required for add_server action"
                return await self._add_server(server_config)
            elif action == "remove_server":
                if not server_name:
                    return "Error: server_name is required for remove_server action"
                return await self._remove_server(server_name)
            elif action == "update_server":
                if not server_name or not server_config:
                    return "Error: server_name and server_config are required for update_server action"
                return await self._update_server(server_name, server_config)
            elif action == "save_config":
                return await self._save_config(config_file, project_name)
            elif action == "load_config":
                return await self._load_config(config_file, project_name)
            elif action == "browse_servers":
                return await self._browse_servers()
            elif action == "validate_config":
                return await self._validate_config(server_name)
            elif action == "export_config":
                return await self._export_config(config_file)
            elif action == "import_config":
                return await self._import_config(config_file)
            else:
                return f"Error: Unknown action '{action}'"

        except Exception as e:
            return f"Error executing MCP management action '{action}': {str(e)}"

    async def _list_configs(self) -> str:
        """List all configured MCP servers."""
        if not self.servers:
            return "No MCP servers configured."

        result = "⚙️ **MCP Server Configurations**\n\n"

        # Group by category
        by_category = {}
        for server in self.servers.values():
            category = server.category
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(server)

        for category, servers in by_category.items():
            result += f"**{category.upper()} ({len(servers)} servers)**\n"
            for server in servers:
                status_icon = "🟢" if server.enabled else "🔴"
                auto_icon = "🔄" if server.auto_connect else ""
                result += f"{status_icon} **{server.name}** {auto_icon}\n"
                result += f"   {server.description}\n"
                result += f"   Command: {' '.join(server.command)}\n"
                if server.env:
                    env_vars = list(server.env.keys())
                    result += f"   Environment: {', '.join(env_vars)}\n"
                result += "\n"

        result += "**Legend:**\n"
        result += "🟢 Enabled | 🔴 Disabled | 🔄 Auto-connect\n\n"

        result += f"**Summary:** {len(self.servers)} servers configured, "
        enabled_count = sum(1 for s in self.servers.values() if s.enabled)
        auto_count = sum(1 for s in self.servers.values() if s.auto_connect)
        result += f"{enabled_count} enabled, {auto_count} auto-connect\n"

        return result

    async def _add_server(self, config: Dict[str, Any]) -> str:
        """Add a new MCP server configuration."""
        try:
            server = MCPServerConfig(**config)

            if server.name in self.servers:
                return f"Error: Server '{server.name}' already exists. Use update_server to modify it."

            self.servers[server.name] = server

            return f"✅ Successfully added MCP server '{server.name}'"

        except Exception as e:
            return f"Error adding server: {str(e)}"

    async def _remove_server(self, server_name: str) -> str:
        """Remove an MCP server configuration."""
        if server_name not in self.servers:
            return f"Error: Server '{server_name}' not found."

        del self.servers[server_name]

        return f"✅ Successfully removed MCP server '{server_name}'"

    async def _update_server(self, server_name: str, config: Dict[str, Any]) -> str:
        """Update an existing MCP server configuration."""
        if server_name not in self.servers:
            return f"Error: Server '{server_name}' not found."

        try:
            # Merge with existing config
            existing = asdict(self.servers[server_name])
            existing.update(config)

            updated_server = MCPServerConfig(**existing)
            self.servers[server_name] = updated_server

            return f"✅ Successfully updated MCP server '{server_name}'"

        except Exception as e:
            return f"Error updating server: {str(e)}"

    async def _save_config(
        self, config_file: Optional[str] = None, project_name: Optional[str] = None
    ) -> str:
        """Save MCP configuration to file."""
        try:
            file_path = config_file or self.config_file

            if project_name:
                project_folder = get_project_folder(project_name)
                file_path = project_folder / file_path
            else:
                file_path = Path(file_path)

            config_data = {
                "version": "1.0",
                "servers": {
                    name: asdict(server) for name, server in self.servers.items()
                },
            }

            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(config_data, f, indent=2)

            return f"✅ MCP configuration saved to '{file_path}'"

        except Exception as e:
            return f"Error saving configuration: {str(e)}"

    async def _load_config(
        self, config_file: Optional[str] = None, project_name: Optional[str] = None
    ) -> str:
        """Load MCP configuration from file."""
        try:
            file_path = config_file or self.config_file

            if project_name:
                project_folder = get_project_folder(project_name)
                file_path = project_folder / file_path
            else:
                file_path = Path(file_path)

            if not file_path.exists():
                return f"Error: Configuration file '{file_path}' not found."

            with open(file_path, "r", encoding="utf-8") as f:
                config_data = json.load(f)

            if "servers" not in config_data:
                return "Error: Invalid configuration file format."

            # Load servers
            loaded_count = 0
            for name, server_data in config_data["servers"].items():
                try:
                    server = MCPServerConfig(**server_data)
                    self.servers[name] = server
                    loaded_count += 1
                except Exception as e:
                    print(f"Warning: Failed to load server '{name}': {e}")

            return (
                f"✅ Loaded {loaded_count} MCP server configurations from '{file_path}'"
            )

        except Exception as e:
            return f"Error loading configuration: {str(e)}"

    async def _browse_servers(self) -> str:
        """Browse available community MCP servers."""
        result = "🌐 **Community MCP Servers**\n\n"

        result += "**Official MCP Servers:**\n"
        official_servers = [
            ("@modelcontextprotocol/server-filesystem", "File system operations"),
            ("@modelcontextprotocol/server-git", "Git repository management"),
            ("@modelcontextprotocol/server-sqlite", "SQLite database operations"),
            ("@modelcontextprotocol/server-postgres", "PostgreSQL database operations"),
            ("@modelcontextprotocol/server-github", "GitHub API integration"),
            ("@modelcontextprotocol/server-brave-search", "Brave Search API"),
            ("@modelcontextprotocol/server-puppeteer", "Web automation"),
            ("@modelcontextprotocol/server-memory", "Persistent memory"),
            ("@modelcontextprotocol/server-fetch", "HTTP requests"),
            ("@modelcontextprotocol/server-everything", "Windows Everything search"),
        ]

        for package, description in official_servers:
            result += f"- **{package}**: {description}\n"

        result += "\n**Community Servers:**\n"
        community_servers = [
            ("mcp-server-docker", "Docker container management"),
            ("mcp-server-kubernetes", "Kubernetes cluster operations"),
            ("mcp-server-aws", "AWS cloud services integration"),
            ("mcp-server-gcp", "Google Cloud Platform tools"),
            ("mcp-server-azure", "Microsoft Azure integration"),
            ("mcp-server-slack", "Slack workspace integration"),
            ("mcp-server-discord", "Discord bot operations"),
            ("mcp-server-notion", "Notion workspace management"),
            ("mcp-server-jira", "Jira project management"),
            ("mcp-server-confluence", "Confluence documentation"),
        ]

        for package, description in community_servers:
            result += f"- **{package}**: {description}\n"

        result += "\n**Installation:**\n"
        result += "Most servers can be installed with: `npx -y <package-name>`\n"
        result += "Some may require additional setup (API keys, authentication)\n\n"

        result += "**Adding Servers:**\n"
        result += "Use the `add_server` action to configure any of these servers.\n"
        result += "Check each server's documentation for specific configuration requirements.\n"

        return result

    async def _validate_config(self, server_name: Optional[str] = None) -> str:
        """Validate MCP server configurations."""
        if server_name:
            if server_name not in self.servers:
                return f"Error: Server '{server_name}' not found."
            servers_to_validate = {server_name: self.servers[server_name]}
        else:
            servers_to_validate = self.servers

        result = "🔍 **MCP Configuration Validation**\n\n"

        valid_count = 0
        total_count = len(servers_to_validate)

        for name, server in servers_to_validate.items():
            result += f"**{name}:**\n"

            issues = []

            # Check command
            if not server.command:
                issues.append("❌ No command specified")
            elif server.command[0] == "npx":
                # Check if Node.js is available
                try:
                    import subprocess

                    subprocess.run(
                        ["node", "--version"], capture_output=True, timeout=5
                    )
                    result += "✅ Node.js available\n"
                except:
                    issues.append("❌ Node.js not found (required for npx)")

            # Check environment variables
            if server.env:
                for env_var, value in server.env.items():
                    if not value and env_var not in os.environ:
                        issues.append(f"⚠️ Environment variable '{env_var}' not set")
                    else:
                        result += f"✅ Environment variable '{env_var}' configured\n"

            # Check description
            if not server.description:
                issues.append("⚠️ No description provided")

            if not issues:
                result += "✅ Configuration valid\n"
                valid_count += 1
            else:
                for issue in issues:
                    result += f"{issue}\n"

            result += "\n"

        result += f"**Summary:** {valid_count}/{total_count} configurations valid\n"

        if valid_count < total_count:
            result += "\n💡 **Tips:**\n"
            result += "- Install Node.js for npx-based servers\n"
            result += "- Set required environment variables\n"
            result += "- Check server documentation for setup requirements\n"

        return result

    async def _export_config(self, config_file: Optional[str] = None) -> str:
        """Export MCP configuration for sharing."""
        try:
            file_path = config_file or "mcp_export.json"

            # Create exportable config (remove sensitive data)
            export_data = {
                "version": "1.0",
                "export_date": "2024-01-01",  # Would use actual date
                "servers": {},
            }

            for name, server in self.servers.items():
                server_data = asdict(server)
                # Remove sensitive environment variables
                if server_data.get("env"):
                    server_data["env"] = {k: "" for k in server_data["env"].keys()}
                export_data["servers"][name] = server_data

            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(export_data, f, indent=2)

            return f"✅ MCP configuration exported to '{file_path}' (sensitive data removed)"

        except Exception as e:
            return f"Error exporting configuration: {str(e)}"

    async def _import_config(self, config_file: Optional[str] = None) -> str:
        """Import MCP configuration from file."""
        if not config_file:
            return "Error: config_file is required for import_config action"

        try:
            file_path = Path(config_file)

            if not file_path.exists():
                return f"Error: Import file '{file_path}' not found."

            with open(file_path, "r", encoding="utf-8") as f:
                import_data = json.load(f)

            if "servers" not in import_data:
                return "Error: Invalid import file format."

            imported_count = 0
            skipped_count = 0

            for name, server_data in import_data["servers"].items():
                try:
                    if name in self.servers:
                        skipped_count += 1
                        continue

                    server = MCPServerConfig(**server_data)
                    self.servers[name] = server
                    imported_count += 1
                except Exception as e:
                    print(f"Warning: Failed to import server '{name}': {e}")

            result = f"✅ Imported {imported_count} MCP server configurations"
            if skipped_count > 0:
                result += f" ({skipped_count} skipped - already exist)"

            return result

        except Exception as e:
            return f"Error importing configuration: {str(e)}"
