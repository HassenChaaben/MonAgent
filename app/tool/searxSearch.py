import os
import sys
from typing import Optional

import requests
from bs4 import BeautifulSoup

from app.tool.base import BaseTool, ToolResult


class SearxSearch(BaseTool):
    """
    A tool for searching a SearxNG instance and extracting URLs and titles.
    """

    name: str = "searx_search"
    description: str = "A tool for searching a SearxNG for web search"
    parameters: dict = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query to execute",
            }
        },
        "required": ["query"],
    }

    def __init__(self, base_url: str = None):
        """Initialize the SearxSearch tool with base URL."""
        super().__init__()
        self.base_url = base_url or os.getenv("SEARXNG_BASE_URL")
        self.user_agent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
        self.paywall_keywords = [
            "Member-only",
            "access denied",
            "restricted content",
            "404",
            "this page is not working",
        ]
        if not self.base_url:
            raise ValueError(
                "SearxNG base URL must be provided either as an argument or via the SEARXNG_BASE_URL environment variable."
            )

    def execute(self, query: str, safety: bool = False) -> str:
        """Execute a search query against a SearxNG instance."""
        if not query or not query.strip():
            return "Error: Empty search query provided."

        search_url = f"{self.base_url}/search"
        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Pragma": "no-cache",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": self.user_agent,
        }
        data = f"q={query}&categories=general&language=auto&time_range=&safesearch=0&theme=simple".encode(
            "utf-8"
        )
        try:
            response = requests.post(
                search_url, headers=headers, data=data, verify=False
            )
            response.raise_for_status()
            html_content = response.text
            soup = BeautifulSoup(html_content, "html.parser")
            results = []
            for article in soup.find_all("article", class_="result"):
                url_header = article.find("a", class_="url_header")
                if url_header:
                    url = url_header["href"]
                    title = (
                        article.find("h3").text.strip()
                        if article.find("h3")
                        else "No Title"
                    )
                    description = (
                        article.find("p", class_="content").text.strip()
                        if article.find("p", class_="content")
                        else "No Description"
                    )
                    results.append(f"Title:{title}\nSnippet:{description}\nLink:{url}")
            if len(results) == 0:
                return "No search results, web search failed."
            return "\n\n".join(
                results
            )  # Return results as a single string, separated by newlines
        except requests.exceptions.RequestException as e:
            raise Exception(
                "\nSearxng search failed. did you run start_services.sh? is docker still running?"
            ) from e

    def execution_failure_check(self, output: str) -> bool:
        """Check if the execution failed based on the output."""
        return "Error" in output or "failed" in output.lower()

    def link_valid(self, link: str) -> str:
        """Check if a link is valid."""
        if not link.startswith("http"):
            return "Status: Invalid URL"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        try:
            response = requests.get(link, headers=headers, timeout=5)
            status = response.status_code
            if status == 200:
                content = response.text.lower()
                if any(keyword in content for keyword in self.paywall_keywords):
                    return "Status: Possible Paywall"
                return "Status: OK"
            elif status == 404:
                return "Status: 404 Not Found"
            elif status == 403:
                return "Status: 403 Forbidden"
            else:
                return f"Status: {status} {response.reason}"
        except requests.exceptions.RequestException as e:
            return f"Error: {str(e)}"

    def check_all_links(self, links: list[str]) -> list[str]:
        """Check all links status one by one."""
        return [self.link_valid(link) for link in links]

    def interpreter_feedback(self, output: str) -> str:
        """
        Feedback of web search to agent.
        """
        if self.execution_failure_check(output):
            return f"Web search failed: {output}"
        return f"Web search result:\n{output}"


if __name__ == "__main__":
    search_tool = SearxSearch(base_url="http://127.0.0.1:8080")
    result = search_tool.execute(["are dog better than cat?"])
    print(result)
