import React, { useState, useEffect, useRef } from 'react';
import '../styles/IDE.css';
import '../styles/CustomOverrides.css'; // Import custom overrides
import '../styles/ThemeOverrides.css'; // Import theme overrides for both light and dark modes
import LogOutput from './LogOutput';

// Define the backend URL (adjust if your backend runs on a different port/host)
// Backend always runs on port 8080, React apps on port 3001, frontend on port 3000
const API_BASE_URL = 'http://localhost:8080';

// SVG Icons
const FolderIcon = ({ isDarkMode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 5C3 3.89543 3.89543 3 5 3H9.5C10.0304 3 10.5391 3.21071 10.9142 3.58579L12.5 5.17157C12.8751 5.54664 13.3838 5.75736 13.9142 5.75736H19C20.1046 5.75736 21 6.65279 21 7.75736V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke={!isDarkMode ? "#38A169" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FileIcon = ({ isDarkMode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke={!isDarkMode ? "#38A169" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 2V8H20" stroke={!isDarkMode ? "#38A169" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BackIcon = ({ isDarkMode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5" stroke={!isDarkMode ? "#38A169" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 19L5 12L12 5" stroke={!isDarkMode ? "#38A169" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditIcon = ({ isDarkMode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke={!isDarkMode ? "#38A169" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke={!isDarkMode ? "#38A169" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SaveIcon = ({ isDarkMode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke={!isDarkMode ? "#38A169" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 21V13H7V21" stroke={!isDarkMode ? "#38A169" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 3V8H15" stroke={!isDarkMode ? "#38A169" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RunIcon = ({ isDarkMode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 3L19 12L5 21V3Z"
      stroke={isDarkMode ? "#00bcd4" : "white"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={isDarkMode ? "rgba(0, 188, 212, 0.1)" : "rgba(255, 255, 255, 0.2)"}
    />
  </svg>
);

// Theme toggle icons
const LightModeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="#00bcd4" />
    <path d="M12 1V3" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 21V23" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M23 12H21" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 12H1" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M19.7778 4.22266L18.3636 5.63687" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M5.63604 18.3638L4.22183 19.778" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M19.7778 19.7783L18.3636 18.3641" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M5.63604 5.63715L4.22183 4.22294" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DarkModeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#F9A825" stroke="#F9A825" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function IDE({ isDarkMode, toggleTheme }) {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState([]);
  const [fileContent, setFileContent] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [runOutput, setRunOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reactStatus, setReactStatus] = useState({ isRunning: false, port: null, url: null });
  const [isReactLoading, setIsReactLoading] = useState(false);
  const editorRef = useRef(null);

  // Add a ref for the breadcrumb
  const breadcrumbRef = useRef(null);
  // Add state for toggle button position
  const [toggleButtonRight, setToggleButtonRight] = useState(50);

  // Add state for script running
  const [isScriptRunning, setIsScriptRunning] = useState(false);
  let scriptStatusInterval = useRef(null);

  // Update toggle button position based on breadcrumb width
  useEffect(() => {
    if (breadcrumbRef.current) {
      const updateButtonPosition = () => {
        const breadcrumbWidth = breadcrumbRef.current.offsetWidth;
        // Calculate position: base position (50px) + extra space if breadcrumb is wide
        const newPosition = Math.max(50, breadcrumbWidth + 30); // 30px extra padding
        setToggleButtonRight(newPosition);
      };

      // Update on mount and when project/path changes
      updateButtonPosition();

      // Also update on window resize
      window.addEventListener('resize', updateButtonPosition);
      return () => window.removeEventListener('resize', updateButtonPosition);
    }
  }, [currentProject, currentPath]);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Check React project status when current project changes or items change
  useEffect(() => {
    if (currentProject) {
      console.log("Current project changed or items updated:", currentProject);
      // Only check status if it's a React project
      if (items.length > 0) {
        const isReact = isReactProject();
        console.log("Is React project check result:", isReact);
        if (isReact) {
          console.log("Checking React project status for:", currentProject);
          checkReactProjectStatus(currentProject);

          // Set up an interval to periodically check the status of the React project
          const statusInterval = setInterval(() => {
            if (reactStatus.isRunning) {
              console.log("Periodic check of React project status for:", currentProject);
              checkReactProjectStatus(currentProject);
            }
          }, 10000); // Check every 10 seconds

          // Clean up the interval when the component unmounts or the project changes
          return () => clearInterval(statusInterval);
        }
      }
    }
  }, [currentProject, items, reactStatus.isRunning]);

  // Add this to the beginning of the IDE component function
  useEffect(() => {
    const loadFileFromStorage = async () => {
      // Check for file data in sessionStorage or localStorage
      const fileDataString = sessionStorage.getItem('ide_file_data') || localStorage.getItem('ideFileToOpen');

      if (!fileDataString) return;

      try {
        const fileData = JSON.parse(fileDataString);
        console.log("Opening file in IDE:", fileData);

        // Clear storage to prevent reopening on refresh
        sessionStorage.removeItem('ide_file_data');
        localStorage.removeItem('ideFileToOpen');

        // IMPORTANT: Set these states immediately to display the file content
        setCurrentProject(fileData.project || "default");
        setCurrentFile(fileData.fileName);
        setFileContent(fileData.content || "");

        // If editing is desired, enable edit mode
        if (fileData.action === 'edit') {
          setIsEditing(true);
        }

        // Create/save the file on the server first
        try {
          const saveResponse = await fetch(`${API_BASE_URL}/workspace/${fileData.project || "default"}/file?file_path=${fileData.fileName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: fileData.content || "" }),
          });

          if (!saveResponse.ok) {
            throw new Error(`Failed to save file: ${saveResponse.status}`);
          }

          console.log("File saved to server successfully");

          // Fetch project files to update the file explorer WITHOUT changing the current file
          const response = await fetch(`${API_BASE_URL}/workspace/${fileData.project || "default"}`);
          if (response.ok) {
            const data = await response.json();
            setItems(data.items);
            setCurrentPath(data.current_path);
          }

          // If action is run and it's a supported file type, run it after saving
          const fileExtension = fileData.fileName.split('.').pop().toLowerCase();
          if (fileData.action === 'run' && ['py', 'js', 'html'].includes(fileExtension)) {
            console.log(`Preparing to run ${fileExtension} file...`);
            // Use a timeout to ensure the UI has updated
            setTimeout(() => {
              console.log("Running file now...");
              runFile(fileData.project || "default", fileData.fileName, fileData.content || "");
            }, 1000);
          }
        } catch (error) {
          console.error("Error processing file:", error);
        }
      } catch (error) {
        console.error("Error parsing file data:", error);
      }
    };

    loadFileFromStorage();
  }, []);

  // Fetch projects from the backend
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workspace`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch files and folders for a project
  const fetchProjectFiles = async (projectName, path = '', preserveCurrentFile = false) => {
    setIsLoading(true);
    try {
      console.log(`Fetching project files for ${projectName}, path: ${path}`);

      // Normalize the path to use forward slashes
      const normalizedPath = path.replace(/\\/g, '/');
      console.log(`Normalized directory path: ${normalizedPath}`);

      // Encode the path properly
      const encodedPath = encodeURIComponent(normalizedPath);
      console.log(`Encoded directory path: ${encodedPath}`);

      const url = `${API_BASE_URL}/workspace/${projectName}?path=${encodedPath}`;
      console.log(`Project files request URL: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error response for project files: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Project files received for ${projectName}:`, data);

      setCurrentProject(projectName);
      setCurrentPath(data.current_path);

      // Ensure all item paths use forward slashes
      const normalizedItems = data.items.map(item => ({
        ...item,
        path: item.path.replace(/\\/g, '/')
      }));

      setItems(normalizedItems);

      // Check React project status when loading a project
      checkReactProjectStatus(projectName);

      // Only reset file view when not preserving current file
      if (!preserveCurrentFile) {
        setCurrentFile(null);
        setFileContent('');
        setIsEditing(false);
        setRunOutput('');
      }
    } catch (error) {
      console.error("Failed to fetch project files:", error);
      alert(`Error loading project files: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch file content
  const fetchFileContent = async (projectName, filePath) => {
    setIsLoading(true);
    try {
      console.log(`Fetching file content for ${projectName}/${filePath}`);

      // Normalize the file path to use forward slashes
      const normalizedPath = filePath.replace(/\\/g, '/');
      console.log(`Normalized path: ${normalizedPath}`);

      // Encode the file path properly
      const encodedFilePath = encodeURIComponent(normalizedPath);
      console.log(`Encoded path: ${encodedFilePath}`);

      const url = `${API_BASE_URL}/workspace/${projectName}/file?file_path=${encodedFilePath}`;
      console.log(`Request URL: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`File content received for ${filePath}:`, data);

      if (data.content !== null) {
        setFileContent(data.content);
        setCurrentFile(filePath);
        setIsEditing(false);
        setRunOutput(''); // Clear previous output when opening a new file
      } else {
        alert("Cannot display binary file content");
      }
    } catch (error) {
      console.error("Failed to fetch file content:", error);
      alert(`Error loading file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save file content
  const saveFileContent = async () => {
    if (!currentProject || !currentFile) {
      console.error("Cannot save file: No file selected");
      return Promise.reject(new Error("No file selected"));
    }

    console.log(`Saving file: ${currentProject}/${currentFile}`);
    setIsLoading(true);

    try {
      // Normalize the file path to use forward slashes
      const normalizedPath = currentFile.replace(/\\/g, '/');
      console.log(`Normalized path for saving: ${normalizedPath}`);

      // Encode the file path properly
      const encodedFilePath = encodeURIComponent(normalizedPath);
      console.log(`Encoded path for saving: ${encodedFilePath}`);

      const url = `${API_BASE_URL}/workspace/${currentProject}/file?file_path=${encodedFilePath}`;
      console.log(`Save request URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fileContent }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error response on save: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        console.log("File saved successfully");
        setIsEditing(false); // Exit edit mode after successful save
        return Promise.resolve(true);
      } else {
        return Promise.reject(new Error("Save operation did not return success status"));
      }
    } catch (error) {
      console.error("Failed to save file:", error);
      alert(`Error saving file: ${error.message}`);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to check script status
  const checkScriptStatus = async (project) => {
    if (!project) return;
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/${project}/script-status`);
      if (response.ok) {
        const data = await response.json();
        setIsScriptRunning(data.status === 'running');
      }
    } catch (e) {
      setIsScriptRunning(false);
    }
  };

  // Poll script status when script is started
  useEffect(() => {
    if (isScriptRunning && currentProject) {
      scriptStatusInterval.current = setInterval(() => checkScriptStatus(currentProject), 1000);
      return () => clearInterval(scriptStatusInterval.current);
    } else {
      if (scriptStatusInterval.current) clearInterval(scriptStatusInterval.current);
    }
  }, [isScriptRunning, currentProject]);

  // Update script status when project/file changes
  useEffect(() => {
    if (currentProject) checkScriptStatus(currentProject);
  }, [currentProject, currentFile]);

  // Modified runFile to set isScriptRunning
  const runFile = async (project, filePath, content) => {
    setIsLoading(true);
    setRunOutput('Running...');
    setIsScriptRunning(false);
    try {
      // Save file before running
      const normalizedPath = filePath.replace(/\\/g, '/');
      const encodedFilePath = encodeURIComponent(normalizedPath);
      const saveUrl = `${API_BASE_URL}/workspace/${project}/file?file_path=${encodedFilePath}`;
      await fetch(saveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      // Run script
      const runUrl = `${API_BASE_URL}/workspace/${project}/run?file_path=${encodedFilePath}`;
      const runResponse = await fetch(runUrl, { method: 'POST' });
      const data = await runResponse.json();
      if (data.status === 'running') {
        setIsScriptRunning(true);
        setRunOutput('Script is running...');
        // Start polling for script completion
        pollScriptCompletion(project);
      } else if (data.status === 'success') {
        setRunOutput(data.output || 'No output');
        setIsScriptRunning(false);
      } else {
        setRunOutput(data.message || 'Error running script');
        setIsScriptRunning(false);
      }
    } catch (error) {
      setRunOutput(`Error: ${error.message}`);
      setIsScriptRunning(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for script completion and fetch output
  const pollScriptCompletion = (project) => {
    let interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/workspace/${project}/script-status`);
        if (response.ok) {
          const data = await response.json();
          if (data.status !== 'running') {
            clearInterval(interval);
            setIsScriptRunning(false);
            // Fetch output (simulate by reloading file content)
            setRunOutput('Script finished. Check output in file or logs.');
          }
        }
      } catch (e) {
        clearInterval(interval);
        setIsScriptRunning(false);
      }
    }, 1000);
  };

  // Stop script handler
  const handleStopScript = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/${currentProject}/stop-script`, { method: 'POST' });
      const data = await response.json();
      setRunOutput(data.message || 'Stopped.');
      setIsScriptRunning(false);
    } catch (e) {
      setRunOutput('Failed to stop script.');
      setIsScriptRunning(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for the Run/Stop button
  const handleRunOrStop = async () => {
    if (isScriptRunning) {
      await handleStopScript();
    } else {
      await handleRunFile();
    }
  };

  // Handler for the Run button
  const handleRunFile = async () => {
    if (!currentProject || !currentFile) {
      console.error("Cannot run file: No file selected");
      setRunOutput("Error: No file selected");
      return;
    }

    // Check if file type is supported
    const fileExtension = currentFile.split('.').pop().toLowerCase();
    if (!['py', 'js', 'html'].includes(fileExtension)) {
      console.error(`Cannot run files with extension .${fileExtension}`);
      setRunOutput(`Error: Files with extension .${fileExtension} are not supported for running`);
      return;
    }

    await runFile(currentProject, currentFile, fileContent);
  };

  // Handle file/folder click
  const handleItemClick = (item) => {
    console.log("Item clicked:", item);

    if (item.type === 'directory') {
      // Navigate to directory
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      console.log(`Navigating to directory: ${newPath}`);
      fetchProjectFiles(currentProject, newPath);
    } else {
      // Open file - ensure we're using the path from the item
      console.log(`Opening file: ${item.path}`);

      // The item.path should already be relative to the project root
      // and should use forward slashes, but let's make sure
      const normalizedPath = item.path.replace(/\\/g, '/');
      console.log(`Normalized item path: ${normalizedPath}`);

      fetchFileContent(currentProject, normalizedPath);
    }
  };

  // Navigate up one directory
  const navigateUp = () => {
    if (!currentPath) {
      // If at root, go back to project list
      setCurrentProject(null);
      setItems([]);
      setCurrentFile(null);
      setFileContent('');
      setIsEditing(false);
      setRunOutput('');
      fetchProjects();
    } else {
      // Go up one directory
      const pathParts = currentPath.split('/');
      pathParts.pop();
      const newPath = pathParts.join('/');
      fetchProjectFiles(currentProject, newPath);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // If already editing, save changes
      saveFileContent();
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };

  // Add these helper functions to the IDE component
  const checkFileExists = async (projectName, filePath) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/${projectName}/file?file_path=${filePath}`);
      return response.ok;
    } catch (error) {
      console.error("Error checking if file exists:", error);
      return false;
    }
  };

  const createFile = async (projectName, filePath, content) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/${projectName}/file?file_path=${filePath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error creating file:", error);
      return false;
    }
  };

  // Function to check if a project is a React project
  const isReactProject = () => {
    // Debug: Log all items to see what we're working with
    console.log("Checking if project is React project. Items:", items);

    // Check if package.json exists in the project root or any directory
    const isReact = items.some(item =>
      item.type === 'file' &&
      item.name === 'package.json'
    );

    console.log("Is React project:", isReact);
    return isReact;
  };

  // Function to check React project status
  const checkReactProjectStatus = async (projectName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/${projectName}/react/status`);
      if (response.ok) {
        const data = await response.json();
        console.log("React project status:", data);

        // Ensure we have a valid port and construct a URL if needed
        const port = data.port || null;
        const url = port ? `http://localhost:${port}/` : null;

        console.log("Setting React status with port:", port, "and URL:", url);

        setReactStatus({
          isRunning: data.is_running,
          port: port,
          url: url
        });
      } else {
        console.error("Failed to check React project status:", await response.text());
        setReactStatus({ isRunning: false, port: null, url: null });
      }
    } catch (error) {
      console.error("Error checking React project status:", error);
      setReactStatus({ isRunning: false, port: null, url: null });
    }
  };

  // Function to start a React project
  const startReactProject = async () => {
    if (!currentProject) {
      console.error("Cannot start React project: No project selected");
      setRunOutput("Error: No project selected");
      return;
    }

    // First check if a React app is already running
    if (reactStatus.isRunning) {
      console.log("React app is already running, stopping it first");
      setRunOutput("A React app is already running. Stopping it before starting a new one...");

      try {
        // Stop the current React app
        await stopReactProject();

        // Wait a moment to ensure the port is freed
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error("Error stopping existing React app:", error);
        setRunOutput("Error: Failed to stop the existing React app. Please try manually stopping it first.");
        return;
      }
    }

    setIsReactLoading(true);
    setRunOutput("Starting React project...");

    try {
      console.log(`Starting React project ${currentProject} on port 3001...`);

      // First check if the project has package.json
      const packageJsonExists = items.some(item =>
        item.type === 'file' &&
        item.name === 'package.json'
      );

      if (!packageJsonExists) {
        console.error("No package.json found in project");
        setRunOutput("Error: This doesn't appear to be a valid React project. No package.json found.");
        setIsReactLoading(false);
        return;
      }

      // Check if node_modules exists, if not, suggest running npm install
      const nodeModulesExists = items.some(item =>
        item.type === 'directory' &&
        item.name === 'node_modules'
      );

      if (!nodeModulesExists) {
        console.warn("No node_modules directory found, suggesting npm install");
        setRunOutput("Warning: node_modules directory not found. The server will attempt to run 'npm install' automatically.\n\nStarting React project...");
      }

      // First check if port 3001 is already in use by something else
      let port3001InUse = false;
      try {
        const testResponse = await fetch(`http://localhost:3001/`, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          timeout: 1000
        });

        console.warn("Port 3001 appears to be in use already");
        setRunOutput(prev => prev + "\nWarning: Port 3001 appears to be in use. The server will attempt to free it...");
        port3001InUse = true;
      } catch (e) {
        // This is expected if the port is free
        console.log("Port 3001 appears to be free");
      }

      // Store response and data in variables accessible outside the try block
      let response, data;

      console.log(`Sending request to start React project ${currentProject} on port 3001...`);
      setRunOutput("Starting React project... This may take a moment.");

      // Use a longer timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      try {
        // First, try to kill any process that might be using port 3001
        if (port3001InUse) {
          setRunOutput(prev => prev + "\nAttempting to free port 3001...");
        }

        // Make sure the backend server is running
        try {
          const serverCheckResponse = await fetch(`${API_BASE_URL}/workspace`, {
            method: 'GET',
            cache: 'no-cache',
            timeout: 2000
          });

          if (!serverCheckResponse.ok) {
            console.error("Backend server is not responding properly");
            setRunOutput("Error: Backend server is not responding properly. Please make sure it's running on port 8080.");
            setIsReactLoading(false);
            return;
          }
          console.log("Backend server is running and responding");
        } catch (e) {
          console.error("Error checking backend server:", e);
          setRunOutput("Error: Cannot connect to backend server. Please make sure it's running on port 8080.");
          setIsReactLoading(false);
          return;
        }

        // Set a timeout to update the UI if the request takes too long
        const uiUpdateTimeout = setTimeout(() => {
          console.log("Updating UI while waiting for response...");
          setRunOutput(prev => prev + "\nStill waiting for response from server...\nThis may take a moment as the server starts the React app.");
        }, 5000);

        try {
          console.log(`Sending request to start React project ${currentProject} on port 3001...`);

          response = await fetch(`${API_BASE_URL}/workspace/${currentProject}/react/start?port=3001`, {
            method: 'POST',
            signal: controller.signal
          });

          // Clear both timeouts
          clearTimeout(timeoutId);
          clearTimeout(uiUpdateTimeout);

          console.log(`Received response with status: ${response.status}`);

          if (!response.ok) {
            console.error(`Server returned error status: ${response.status}`);
            setRunOutput(`Error: Server returned status ${response.status}. Please try again.`);
            setIsReactLoading(false);
            return;
          }

          // Log the raw response text for debugging
          const responseText = await response.text();
          console.log(`Raw response: ${responseText}`);

          // Try to parse as JSON
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error("Failed to parse response as JSON:", e);
            setRunOutput(`Error: Invalid response from server: ${responseText}`);
            setIsReactLoading(false);
            return;
          }

          console.log("React project start response:", data);
        } catch (error) {
          // Clear the UI update timeout if there's an error
          clearTimeout(uiUpdateTimeout);
          throw error; // Re-throw to be caught by the outer catch block
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error("Request timed out after 60 seconds");
          setRunOutput("Error: Request timed out. The server may be overloaded or the React project may be too large to start quickly. Please try again.");
          setIsReactLoading(false);
          return;
        }
        console.error("Error starting React project:", error);
        setRunOutput(`Error starting React project: ${error.message}`);
        setIsReactLoading(false);
        return;
      }

      if (response.ok && data.status === 'success') {
        // Ensure we have a valid port and construct a URL if needed
        const port = data.port || 3001;
        const url = `http://localhost:${port}/`;

        console.log("Setting React status with port:", port, "and URL:", url);

        setReactStatus({
          isRunning: true,
          port: port,
          url: url
        });

        // Open the React app in a new browser tab
        try {
          window.open(url, '_blank');
          console.log("Opened React app in new browser tab:", url);
        } catch (e) {
          console.error("Failed to open React app in browser:", e);
        }

        setRunOutput(`React project started successfully!\n\nYou can view it at: ${url}\n\nThe app has been opened in a new browser tab.\n\n${data.message}`);

        // Verify the app is actually running by checking the port after a short delay
        setTimeout(async () => {
          try {
            // Try to fetch the React app directly
            try {
              const appResponse = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
                timeout: 2000
              });
              console.log("React app is accessible at", url);
            } catch (e) {
              console.warn("React app is not accessible directly:", e);
              // Check status through the API as a fallback
              const statusResponse = await fetch(`${API_BASE_URL}/workspace/${currentProject}/react/status`);
              const statusData = await statusResponse.json();

              if (!statusData.is_running) {
                console.error("React app failed to start properly");
                setRunOutput(prevOutput => prevOutput + "\n\nWarning: The React app may not have started properly. Please check the console for errors.");
                setReactStatus({ isRunning: false, port: null, url: null });
              }
            }
          } catch (error) {
            console.error("Error verifying React app status:", error);
          }
        }, 5000);
      } else {
        console.error("Failed to start React project:", data);
        let errorMessage = data.message || "Unknown error";

        // Check if the error suggests an alternative port
        const alternativePortMatch = errorMessage.match(/try using port (\d+) instead/i);
        if (alternativePortMatch) {
          const alternativePort = alternativePortMatch[1];
          setRunOutput(`Failed to start React project on port 3001: ${errorMessage}\n\nWould you like to try port ${alternativePort} instead?`);

          // Add a button to try the alternative port
          setTimeout(() => {
            const tryAlternativePort = async () => {
              setRunOutput(`Trying to start React project on port ${alternativePort}...`);
              setIsReactLoading(true);

              try {
                const altResponse = await fetch(`${API_BASE_URL}/workspace/${currentProject}/react/start?port=${alternativePort}`, {
                  method: 'POST'
                });

                const altData = await altResponse.json();

                if (altResponse.ok && altData.status === 'success') {
                  const url = `http://localhost:${alternativePort}/`;
                  setReactStatus({
                    isRunning: true,
                    port: parseInt(alternativePort),
                    url: url
                  });

                  // Open the React app in a new browser tab
                  try {
                    window.open(url, '_blank');
                    console.log("Opened React app in new browser tab:", url);
                  } catch (e) {
                    console.error("Failed to open React app in browser:", e);
                  }

                  setRunOutput(`React project started successfully on port ${alternativePort}!\n\nYou can view it at: ${url}\n\nThe app has been opened in a new browser tab.\n\n${altData.message}`);
                } else {
                  setRunOutput(`Failed to start React project on port ${alternativePort}: ${altData.message || "Unknown error"}`);
                  setReactStatus({ isRunning: false, port: null, url: null });
                }
              } catch (error) {
                setRunOutput(`Error starting React project on port ${alternativePort}: ${error.message}`);
                setReactStatus({ isRunning: false, port: null, url: null });
              } finally {
                setIsReactLoading(false);
              }
            };

            // This is just to simulate a button - in a real app, you'd add a button to the UI
            console.log(`To try port ${alternativePort}, call tryAlternativePort()`);
          }, 100);
        } else {
          setRunOutput(`Failed to start React project: ${errorMessage}`);
          setReactStatus({ isRunning: false, port: null, url: null });
        }
      }
    } catch (error) {
      console.error("Error starting React project:", error);
      setRunOutput(`Error starting React project: ${error.message}`);
      setReactStatus({ isRunning: false, port: null, url: null });
    } finally {
      setIsReactLoading(false);
    }
  };

  // Function to stop a React project
  const stopReactProject = async () => {
    if (!currentProject) {
      console.error("Cannot stop React project: No project selected");
      setRunOutput("Error: No project selected");
      return;
    }

    setIsReactLoading(true);
    setRunOutput("Stopping React project...");

    try {
      // Store the current port before stopping
      const currentPort = reactStatus.port;

      const response = await fetch(`${API_BASE_URL}/workspace/${currentProject}/react/stop`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        console.log("React project stopped:", data);
        setReactStatus({ isRunning: false, port: null, url: null });
        setRunOutput(`React project stopped successfully!\n\n${data.message}`);

        // Verify the port is actually free
        if (currentPort) {
          setTimeout(async () => {
            try {
              await fetch(`http://localhost:${currentPort}/`, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
                timeout: 1000
              });

              console.warn(`Port ${currentPort} still appears to be in use after stopping React app`);
              setRunOutput(prev => prev + `\n\nWarning: Port ${currentPort} may still be in use by another process. You may need to restart your computer if you continue to have issues.`);
            } catch (e) {
              // This is expected if the port is free
              console.log(`Port ${currentPort} is now free`);
            }
          }, 2000);
        }
      } else {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || "Unknown error";
        } catch (e) {
          errorMessage = await response.text();
        }

        console.error("Failed to stop React project:", errorMessage);
        setRunOutput(`Failed to stop React project: ${errorMessage}`);

        // Even if the server failed to stop it, try to update the status
        // This helps recover from situations where the server thinks it's running but it's not
        const statusResponse = await fetch(`${API_BASE_URL}/workspace/${currentProject}/react/status`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (!statusData.is_running) {
            console.log("React project is not running according to status check");
            setReactStatus({ isRunning: false, port: null, url: null });
            setRunOutput(prev => prev + "\n\nThe React project appears to be stopped despite the error.");
          }
        }
      }
    } catch (error) {
      console.error("Error stopping React project:", error);
      setRunOutput(`Error stopping React project: ${error.message}`);

      // Try to reset the status anyway to recover from errors
      setReactStatus({ isRunning: false, port: null, url: null });
    } finally {
      setIsReactLoading(false);
    }

    // Return a promise that resolves when the function completes
    return Promise.resolve();
  };

  // Function to stop any process running on port 3001
  const stopPort3001 = async () => {
    console.log("Attempting to stop any process running on port 3001");
    setRunOutput("Stopping any process running on port 3001...");

    // Set loading state
    setIsReactLoading(true);

    try {
      // Call the backend endpoint to kill any process on port 3001
      // Pass port as a query parameter instead of in the request body
      const response = await fetch(`${API_BASE_URL}/react/stop-port?port=3001`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log("Stop port 3001 response:", data);

      if (data.status === 'success') {
        // If a process was running and was successfully stopped
        if (data.was_running) {
          setRunOutput(`Successfully stopped process on port 3001.\n\n${data.message}`);

          // If the current React project was running on port 3001, update its status
          if (reactStatus.isRunning && reactStatus.port === 3001) {
            setReactStatus({ isRunning: false, port: null, url: null });
          }
        } else {
          // If no process was running on port 3001
          setRunOutput(`${data.message}`);
        }
      } else {
        // If there was an error stopping the process
        setRunOutput(`Error: ${data.message}`);
      }

      // Verify the port is actually free
      setTimeout(async () => {
        try {
          await fetch('http://localhost:3001/', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            timeout: 1000
          });

          console.warn("Port 3001 still appears to be in use after stopping");
          setRunOutput(prev => prev + "\n\nWarning: Port 3001 may still be in use by another process. You may need to restart your computer if you continue to have issues.");
        } catch (e) {
          // This is expected if the port is free
          console.log("Port 3001 is now free");
        }
      }, 2000);
    } catch (error) {
      console.error("Error stopping process on port 3001:", error);
      setRunOutput(`Error stopping process on port 3001: ${error.message}`);
    } finally {
      setIsReactLoading(false);
    }
  };

  // Add this function to handle project deletion
  const handleDeleteProject = async (projectName, e) => {
    e.stopPropagation(); // Prevent navigation to the project

    if (window.confirm(`Are you sure you want to delete the project "${projectName}"? This will permanently delete all files in this project.`)) {
      try {
        console.log(`Deleting project: ${projectName}`);
        setIsLoading(true);

        // Call the backend to delete the project
        const response = await fetch(`${API_BASE_URL}/workspace/${projectName}/delete`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete project: ${response.status}`);
        }

        console.log(`Project ${projectName} deleted successfully`);

        // If the deleted project was the current one, go back to project list
        if (projectName === currentProject) {
          setCurrentProject(null);
          setItems([]);
          setCurrentFile(null);
          setFileContent('');
          setIsEditing(false);
          setRunOutput('');
        }

        // Refresh the project list
        fetchProjects();

      } catch (error) {
        console.error(`Failed to delete project ${projectName}:`, error);
        alert('Failed to delete project. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`ide-container ${!isDarkMode ? 'light-mode' : ''}`}>
      {/* Theme toggle button */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          right: `${toggleButtonRight}px`,
          top: '10px'
        }}
      >
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </button>

      {/* IDE Header */}
      <div className="ide-header" style={!isDarkMode ? { borderBottom: '1px solid rgba(56, 161, 105, 0.2)' } : {}}>
        <h1 className={isDarkMode ? "neon-text" : ""} style={!isDarkMode ? { color: '#38A169' } : {}}>Workspace IDE</h1>
        <div className="breadcrumb" ref={breadcrumbRef}>
          {currentProject ? (
            <>
              <span className="breadcrumb-item" onClick={() => { setCurrentProject(null); fetchProjects(); }} style={!isDarkMode ? { color: '#38A169' } : {}}>
                <FolderIcon isDarkMode={isDarkMode} />
              </span>
              <span className="breadcrumb-separator" style={!isDarkMode ? { color: '#38A169' } : {}}>/</span>
              <span className="breadcrumb-item" onClick={() => fetchProjectFiles(currentProject)} style={!isDarkMode ? { color: '#38A169' } : {}}>
                {currentProject}
              </span>
              {currentPath && (
                <>
                  <span className="breadcrumb-separator" style={!isDarkMode ? { color: '#38A169' } : {}}>/</span>
                  {currentPath.split('/').map((part, index, array) => (
                    <React.Fragment key={index}>
                      <span
                        className="breadcrumb-item"
                        onClick={() => fetchProjectFiles(currentProject, array.slice(0, index + 1).join('/'))}
                        style={!isDarkMode ? { color: '#38A169' } : {}}
                      >
                        {part}
                      </span>
                      {index < array.length - 1 && <span className="breadcrumb-separator" style={!isDarkMode ? { color: '#38A169' } : {}}>/</span>}
                    </React.Fragment>
                  ))}
                </>
              )}
            </>
          ) : (
            <span className="breadcrumb-item" style={!isDarkMode ? { color: '#38A169' } : {}}>
              <FolderIcon isDarkMode={isDarkMode} />
            </span>
          )}
        </div>
      </div>

      {/* Main IDE Content */}
      <div className="ide-content">
        {/* File Explorer */}
        <div className="file-explorer" style={!isDarkMode ? { borderRight: '1px solid rgba(56, 161, 105, 0.2)' } : {}}>
          <div className="file-explorer-header">
            <h2 className={isDarkMode ? "neon-text" : ""} style={!isDarkMode ? { color: '#38A169' } : {}}>Files</h2>
            {(currentProject || currentPath) && (
              <button className="back-button" onClick={navigateUp} style={!isDarkMode ? {
                backgroundColor: 'rgba(56, 161, 105, 0.1)',
                color: '#38A169',
                border: '1px solid rgba(56, 161, 105, 0.3)'
              } : {}}>
                <BackIcon isDarkMode={isDarkMode} /> Back
              </button>
            )}
          </div>

          {/* React Project Controls */}
          {currentProject && items.length > 0 && isReactProject() && (
            <div className="react-controls" style={{ padding: '10px', borderBottom: isDarkMode ? '1px solid #333' : '1px solid rgba(56, 161, 105, 0.2)' }}>
              <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', color: isDarkMode ? '#00BCD4' : '#38A169' }}>
                React Project
              </h3>

              {reactStatus.isRunning ? (
                <div>
                  <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                    Running on port: {reactStatus.port}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        // First check if the port is actually in use
                        setRunOutput("Checking React app status...");

                        fetch(`${API_BASE_URL}/workspace/${currentProject}/react/status`)
                          .then(response => response.json())
                          .then(data => {
                            if (data.is_running && data.port) {
                              // Always use the port to construct the URL to avoid undefined errors
                              const url = `http://localhost:${data.port}/`;
                              console.log("Opening React app at URL:", url);

                              // Try to ping the React app directly to verify it's accessible
                              setRunOutput("Verifying React app is accessible...");

                              // Use a fetch with a timeout to check if the app is accessible
                              const controller = new AbortController();
                              const timeoutId = setTimeout(() => controller.abort(), 5000);

                              fetch(url, {
                                method: 'GET',
                                mode: 'no-cors', // Important for cross-origin requests
                                cache: 'no-cache',
                                signal: controller.signal
                              })
                                .then(() => {
                                  clearTimeout(timeoutId);
                                  console.log("React app is accessible");
                                  setRunOutput(`React app is accessible at ${url}\n\nOpening in a new browser tab...`);

                                  // Open in a new tab with focus
                                  const newWindow = window.open(url, '_blank');
                                  if (newWindow) {
                                    newWindow.focus();
                                  }
                                })
                                .catch(error => {
                                  clearTimeout(timeoutId);
                                  console.error("Error accessing React app:", error);

                                  if (error.name === 'AbortError') {
                                    setRunOutput("Warning: React app is not responding quickly. Opening anyway, but it may not be fully loaded yet.");
                                  } else {
                                    setRunOutput("Warning: React app may not be fully accessible yet. Opening anyway, but you may need to refresh the page.");
                                  }

                                  // Open the URL anyway, as the app might still be starting up
                                  window.open(url, '_blank');
                                });
                            } else {
                              console.error("React app is not running or port is not available");
                              setRunOutput("Error: React app is not running. Please try starting it again.");
                              setReactStatus({ isRunning: false, port: null, url: null });
                            }
                          })
                          .catch(error => {
                            console.error("Error checking React app status before opening:", error);
                            setRunOutput(`Error checking React app status: ${error.message}`);
                          });
                      }}
                      disabled={isReactLoading || !reactStatus.port}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isDarkMode ? '#00BCD4' : '#38A169',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        flex: '1'
                      }}
                    >
                      View App
                    </button>
                    <button
                      onClick={stopReactProject}
                      disabled={isReactLoading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isDarkMode ? '#F44336' : '#E53E3E',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        flex: '1'
                      }}
                    >
                      Stop App
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={startReactProject}
                    disabled={isReactLoading}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: isDarkMode ? '#00BCD4' : '#38A169',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      width: '100%',
                      marginBottom: '8px'
                    }}
                  >
                    {isReactLoading ? 'Starting...' : 'Start React App'}
                  </button>

                  {/* Stop React App Button */}
                  <button
                    onClick={stopPort3001}
                    disabled={isReactLoading}
                    className="stop-react-app-button"
                    title="Stop any React app running on port 3001"
                    style={{
                      padding: '6px 12px',
                      backgroundColor: isDarkMode ? '#F44336' : '#E53E3E',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      width: '100%',
                      boxShadow: isDarkMode ? '0 0 8px rgba(244, 67, 54, 0.5)' : '0 2px 4px rgba(229, 62, 62, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Stop React App (Port 3001)
                  </button>
                </div>
              )}
            </div>
          )}

          {isLoading && !items.length && !projects.length ? (
            <div className="loading">Loading...</div>
          ) : currentProject ? (
            <div className="file-list">
              {items.map((item) => (
                <div
                  key={item.path}
                  className={`file-item ${item.type}`}
                  onClick={() => handleItemClick(item)}
                  style={!isDarkMode && item.type === 'directory' ? {
                    backgroundColor: 'rgba(56, 161, 105, 0.05)',
                    borderLeft: '2px solid rgba(56, 161, 105, 0.3)'
                  } : {}}
                >
                  {item.type === 'directory' ? <FolderIcon isDarkMode={isDarkMode} /> : <FileIcon isDarkMode={isDarkMode} />}
                  <span className="file-name">{item.name}</span>
                </div>
              ))}
              {!items.length && <div className="empty-message">No files found</div>}
            </div>
          ) : (
            <div className="project-list">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className="project-item"
                  style={!isDarkMode ? {
                    backgroundColor: 'rgba(56, 161, 105, 0.05)',
                    borderLeft: '2px solid rgba(56, 161, 105, 0.3)',
                    color: '#38A169',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  } : {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div
                    className="project-name-container"
                    onClick={() => fetchProjectFiles(project.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      cursor: 'pointer'
                    }}
                  >
                    <FolderIcon isDarkMode={isDarkMode} />
                    <span className="project-name">{project.name}</span>
                  </div>
                  <button
                    className="delete-project-btn"
                    onClick={(e) => handleDeleteProject(project.name, e)}
                    title="Delete project"
                    style={{
                      opacity: 0,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      // Color is now controlled by CSS in DeleteButton.css
                      // This ensures the red color in light mode
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="delete-icon">
                      <path d="M3 6H5H21" stroke={isDarkMode ? "currentColor" : "#E53E3E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke={isDarkMode ? "currentColor" : "#E53E3E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}
              {!projects.length && <div className="empty-message">No projects found</div>}
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="editor-area">
          {currentFile ? (
            <>
              <div className="editor-header" style={!isDarkMode ? { borderBottom: '1px solid rgba(56, 161, 105, 0.2)' } : {}}>
                <h3 className={isDarkMode ? "neon-text" : ""} style={!isDarkMode ? { color: '#38A169' } : {}}>{currentFile}</h3>
                <div className="editor-actions">
                  <button
                    className={`action-button ${isEditing ? 'active' : ''}`}
                    onClick={toggleEditMode}
                    title={isEditing ? "Save" : "Edit"}
                    style={!isDarkMode ? {
                      backgroundColor: isEditing ? 'rgba(56, 161, 105, 0.1)' : 'transparent',
                      color: '#38A169',
                      border: '1px solid rgba(56, 161, 105, 0.3)'
                    } : {}}
                  >
                    {isEditing ? <SaveIcon isDarkMode={isDarkMode} /> : <EditIcon isDarkMode={isDarkMode} />}
                    {isEditing ? "Save" : "Edit"}
                  </button>

                  {(currentFile.endsWith('.py') || currentFile.endsWith('.js') || currentFile.endsWith('.html')) && (
                    <button
                      className={`action-button run${isScriptRunning ? ' active' : ''}`}
                      onClick={handleRunOrStop}
                      disabled={isLoading}
                      title={isScriptRunning ? 'Stop' : 'Run'}
                      style={!isDarkMode ? {
                        backgroundColor: isScriptRunning ? '#E53E3E' : '#38A169',
                        color: 'white',
                        border: isScriptRunning ? '1px solid #E53E3E' : '1px solid #2F855A',
                        boxShadow: '0 2px 8px rgba(56, 161, 105, 0.2)'
                      } : {}}
                    >
                      {isScriptRunning ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="6" y="6" width="12" height="12" rx="2" fill="white" stroke={isDarkMode ? '#F44336' : '#E53E3E'} strokeWidth="2" />
                        </svg>
                      ) : (
                        <RunIcon isDarkMode={isDarkMode} />
                      )}
                      {isScriptRunning ? 'Stop' : 'Run'}
                    </button>
                  )}
                </div>
              </div>

              <div className="editor-content">
                {isEditing ? (
                  <textarea
                    ref={editorRef}
                    className="code-editor"
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    spellCheck="false"
                    style={!isDarkMode ? {
                      backgroundColor: '#F5FAF7',
                      border: '1px solid rgba(56, 161, 105, 0.2)',
                      color: '#2D3748'
                    } : {}}
                  />
                ) : (
                  <pre className="code-viewer" style={!isDarkMode ? {
                    backgroundColor: '#F5FAF7',
                    border: '1px solid rgba(56, 161, 105, 0.2)',
                    color: '#2D3748'
                  } : {}}>{fileContent}</pre>
                )}
              </div>

              {runOutput && (
                <div className="run-output" style={!isDarkMode ? {
                  backgroundColor: 'rgba(56, 161, 105, 0.05)',
                  border: '1px solid rgba(56, 161, 105, 0.2)'
                } : {}}>
                  <LogOutput output={runOutput} isDarkMode={isDarkMode} />
                </div>
              )}
            </>
          ) : (
            <div className="no-file-selected" style={!isDarkMode ? {
              backgroundColor: 'rgba(56, 161, 105, 0.03)',
              border: '1px dashed rgba(56, 161, 105, 0.3)',
              borderRadius: '8px'
            } : {}}>
              <h3 className={isDarkMode ? "neon-text" : ""} style={!isDarkMode ? { color: '#38A169' } : {}}>No file selected</h3>
              <p style={!isDarkMode ? { color: '#2D3748' } : {}}>Select a file from the explorer to view or edit its content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IDE;























