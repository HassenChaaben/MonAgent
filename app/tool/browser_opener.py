import os
import platform
import subprocess
import time
import webbrowser
from typing import Optional

from app.logger import logger

# Check if we're on Windows
IS_WINDOWS = platform.system() == "Windows"


def open_browser_url(url: str, delay_seconds: Optional[int] = 0) -> bool:
    """
    Open a URL in the default browser after an optional delay.
    
    Args:
        url: The URL to open
        delay_seconds: Optional delay in seconds before opening the browser
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Apply delay if specified
        if delay_seconds and delay_seconds > 0:
            logger.info(f"Waiting {delay_seconds} seconds before opening browser at {url}")
            time.sleep(delay_seconds)
            
        logger.info(f"Opening browser at URL: {url}")
        
        # Try to use the system's default browser
        if IS_WINDOWS:
            # On Windows, use the start command which uses the default browser
            try:
                subprocess.run(f'start "" "{url}"', shell=True, check=True)
                return True
            except subprocess.CalledProcessError as e:
                logger.error(f"Error opening browser with start command: {str(e)}")
                # Fall back to webbrowser module
        
        # Use Python's webbrowser module as a fallback
        browser_opened = webbrowser.open(url)
        
        if browser_opened:
            logger.info(f"Successfully opened browser at {url}")
            return True
        else:
            logger.error(f"Failed to open browser at {url}")
            return False
            
    except Exception as e:
        logger.error(f"Error opening browser: {str(e)}")
        return False
