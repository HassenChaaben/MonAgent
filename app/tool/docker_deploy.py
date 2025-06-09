import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Union

from app.tool.base import BaseTool


class DockerDeploy(BaseTool):
    """A tool for generating Docker deployment configurations and scripts."""

    name: str = "docker_deploy"
    description: str = (
        "Generates Docker deployment configurations for the application, including Dockerfile, docker-compose.yml, and deployment scripts."
    )
    parameters: dict = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "description": "The action to perform (generate_dockerfile, generate_compose, generate_deployment_script, get_deployment_status).",
                "enum": [
                    "generate_dockerfile",
                    "generate_compose",
                    "generate_deployment_script",
                    "get_deployment_status",
                ],
            },
            "environment": {
                "type": "string",
                "description": "The deployment environment (development, production).",
                "enum": ["development", "production"],
                "default": "development",
            },
            "include_frontend": {
                "type": "boolean",
                "description": "Whether to include frontend in the deployment.",
                "default": True,
            },
            "output_path": {
                "type": "string",
                "description": "Path where to save the generated files.",
                "default": "",
            },
            "port": {
                "type": "integer",
                "description": "The port to expose the application on.",
                "default": 8080,
            },
        },
        "required": ["action"],
    }

    async def execute(
        self,
        action: str,
        environment: str = "development",
        include_frontend: bool = True,
        output_path: str = "",
        port: int = 8080,
        **kwargs,
    ) -> Dict:
        """
        Execute the Docker deployment tool with the specified action.

        Args:
            action: The action to perform
            environment: The deployment environment (development, production)
            include_frontend: Whether to include frontend in the deployment
            output_path: Path where to save the generated files
            port: The port to expose the application on

        Returns:
            Dict: Contains the result of the action
        """
        try:
            if action == "generate_dockerfile":
                return await self._generate_dockerfile(
                    environment, include_frontend, output_path
                )
            elif action == "generate_compose":
                return await self._generate_compose(
                    environment, include_frontend, output_path, port
                )
            elif action == "generate_deployment_script":
                return await self._generate_deployment_script(environment, output_path)
            elif action == "get_deployment_status":
                return await self._get_deployment_status()
            else:
                return {
                    "success": False,
                    "message": f"Unknown action: {action}",
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error executing Docker deployment tool: {str(e)}",
            }

    async def _generate_dockerfile(
        self, environment: str, include_frontend: bool, output_path: str
    ) -> Dict:
        """Generate a Dockerfile for the application."""

        # Base Dockerfile content
        dockerfile_content = """FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    git \\
    curl \\
    nodejs \\
    npm \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

"""

        # Add frontend setup if included
        if include_frontend:
            dockerfile_content += """# Set up frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

WORKDIR /app
"""

        # Add environment-specific configurations
        if environment == "development":
            dockerfile_content += """
# Development environment setup
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose the application port
EXPOSE 8080

# Start the application in development mode
CMD ["python", "app.py"]
"""
        else:  # production
            dockerfile_content += """
# Production environment setup
ENV PYTHONUNBUFFERED=1

# Expose the production port
EXPOSE 8080

# Start the application with Gunicorn for production
RUN pip install --no-cache-dir gunicorn
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8080", "app:app", "--workers", "4"]
"""

        # Save the Dockerfile
        try:
            # Normalize the output path to handle backslashes correctly
            if output_path:
                # Convert backslashes to forward slashes and ensure no double slashes
                normalized_path = output_path.replace("\\", "/").rstrip("/")
                # Create the directory if it doesn't exist
                os.makedirs(normalized_path, exist_ok=True)
                file_path = f"{normalized_path}/Dockerfile"
            else:
                file_path = "Dockerfile"

            print(f"Saving Dockerfile to: {file_path}")

            # Ensure the directory exists
            directory = os.path.dirname(file_path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)

            with open(file_path, "w") as f:
                f.write(dockerfile_content)
        except Exception as e:
            print(f"Error saving Dockerfile: {str(e)}")
            raise

        return {
            "success": True,
            "message": f"Dockerfile generated successfully at {file_path}",
            "content": dockerfile_content,
        }

    async def _generate_compose(
        self, environment: str, include_frontend: bool, output_path: str, port: int
    ) -> Dict:
        """Generate a docker-compose.yml file for the application."""

        # Base docker-compose content
        compose_content = """version: '3.8'

services:
  backend:
    build: .
    restart: always
"""

        # Add environment-specific configurations
        if environment == "development":
            compose_content += f"""    ports:
      - "{port}:8080"
    volumes:
      - ./:/app
      - /app/frontend/node_modules
    environment:
      - PYTHONUNBUFFERED=1
      - PYTHONDONTWRITEBYTECODE=1
"""
        else:  # production
            compose_content += f"""    ports:
      - "{port}:8080"
    environment:
      - PYTHONUNBUFFERED=1
"""

        # Add frontend service if included
        if include_frontend and environment == "development":
            compose_content += """
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8080
    depends_on:
      - backend
"""

        # Save the docker-compose.yml file
        try:
            # Normalize the output path to handle backslashes correctly
            if output_path:
                # Convert backslashes to forward slashes and ensure no double slashes
                normalized_path = output_path.replace("\\", "/").rstrip("/")
                # Create the directory if it doesn't exist
                os.makedirs(normalized_path, exist_ok=True)
                file_path = f"{normalized_path}/docker-compose.yml"
            else:
                file_path = "docker-compose.yml"

            print(f"Saving docker-compose.yml to: {file_path}")

            # Ensure the directory exists
            directory = os.path.dirname(file_path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)

            with open(file_path, "w") as f:
                f.write(compose_content)
        except Exception as e:
            print(f"Error saving docker-compose.yml: {str(e)}")
            raise

        # If frontend is included and we're in development mode, create a Dockerfile.dev for the frontend
        if include_frontend and environment == "development":
            frontend_dockerfile_content = """FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]
"""
            try:
                # Normalize the output path to handle backslashes correctly
                if output_path:
                    # Convert backslashes to forward slashes and ensure no double slashes
                    normalized_path = output_path.replace("\\", "/").rstrip("/")
                    frontend_dockerfile_path = (
                        f"{normalized_path}/frontend/Dockerfile.dev"
                    )
                else:
                    frontend_dockerfile_path = "frontend/Dockerfile.dev"

                print(f"Saving frontend Dockerfile.dev to: {frontend_dockerfile_path}")

                # Ensure the directory exists
                frontend_dir = os.path.dirname(frontend_dockerfile_path)
                os.makedirs(frontend_dir, exist_ok=True)

                with open(frontend_dockerfile_path, "w") as f:
                    f.write(frontend_dockerfile_content)
            except Exception as e:
                print(f"Error saving frontend Dockerfile.dev: {str(e)}")
                # Don't raise here, as this is optional and shouldn't fail the whole process

        return {
            "success": True,
            "message": f"Docker Compose file generated successfully at {file_path}",
            "content": compose_content,
        }

    async def _generate_deployment_script(
        self, environment: str, output_path: str
    ) -> Dict:
        """Generate deployment scripts for the application."""

        # Create deployment script for the specified environment
        if environment == "development":
            script_content = """#!/bin/bash
# Development deployment script

# Build and start the containers
docker-compose up --build -d

echo "Development environment started. Access the application at http://localhost:8080"
"""
        else:  # production
            script_content = """#!/bin/bash
# Production deployment script

# Build and start the containers
docker-compose -f docker-compose.yml up --build -d

echo "Production environment deployed. Access the application at http://localhost:8080"
"""

        # Save the deployment script
        try:
            script_filename = f"deploy_{environment}.sh"

            # Normalize the output path to handle backslashes correctly
            if output_path:
                # Convert backslashes to forward slashes and ensure no double slashes
                normalized_path = output_path.replace("\\", "/").rstrip("/")
                # Create the directory if it doesn't exist
                os.makedirs(normalized_path, exist_ok=True)
                file_path = f"{normalized_path}/{script_filename}"
            else:
                file_path = script_filename

            print(f"Saving deployment script to: {file_path}")

            # Ensure the directory exists
            directory = os.path.dirname(file_path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)

            with open(file_path, "w") as f:
                f.write(script_content)

            # Make the script executable
            try:
                os.chmod(file_path, 0o755)
                print(f"Made script executable: {file_path}")
            except Exception as e:
                print(f"Warning: Could not make script executable: {str(e)}")
                # Continue anyway, as this might be on Windows where chmod doesn't work the same way
        except Exception as e:
            print(f"Error saving deployment script: {str(e)}")
            raise

        return {
            "success": True,
            "message": f"Deployment script generated successfully at {file_path}",
            "content": script_content,
        }

    async def _get_deployment_status(self) -> Dict:
        """Get the current deployment status."""
        try:
            # Check if Docker is installed
            import subprocess

            docker_result = subprocess.run(
                ["docker", "--version"], capture_output=True, text=True
            )
            docker_compose_result = subprocess.run(
                ["docker-compose", "--version"], capture_output=True, text=True
            )

            # Check if deployment files exist
            # Look in current directory and common output directories
            possible_paths = [".", "Dockerfile", "docker"]

            dockerfile_exists = False
            for path in possible_paths:
                if os.path.exists(os.path.join(path, "Dockerfile").replace("\\", "/")):
                    dockerfile_exists = True
                    break

            compose_exists = False
            for path in possible_paths:
                if os.path.exists(
                    os.path.join(path, "docker-compose.yml").replace("\\", "/")
                ):
                    compose_exists = True
                    break

            # Check if containers are running
            containers_result = subprocess.run(
                ["docker", "ps", "--filter", "name=openmanus"],
                capture_output=True,
                text=True,
            )

            return {
                "success": True,
                "docker_installed": docker_result.returncode == 0,
                "docker_compose_installed": docker_compose_result.returncode == 0,
                "dockerfile_exists": dockerfile_exists,
                "compose_exists": compose_exists,
                "containers_running": "openmanus" in containers_result.stdout,
                "docker_version": (
                    docker_result.stdout.strip()
                    if docker_result.returncode == 0
                    else "Not installed"
                ),
                "docker_compose_version": (
                    docker_compose_result.stdout.strip()
                    if docker_compose_result.returncode == 0
                    else "Not installed"
                ),
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error getting deployment status: {str(e)}",
            }
