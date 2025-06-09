import React from 'react';

const CodeBlock = ({ code, language, fileName }) => {
  // Default project name
  const projectName = "default";

  // Function to handle IDE navigation
  const handleIDENavigation = (action, e) => {
    e.preventDefault();
    e.stopPropagation();

    // Create a file name if none provided
    let fileToOpen = fileName;

    // If no filename is provided, create one based on language
    if (!fileToOpen) {
      // For run action, ensure we use a supported extension
      if (action === 'run') {
        // Always use Python for run action
        fileToOpen = `code_snippet_${Date.now()}.py`;
      } else {
        // For edit action, use the language or default to txt
        fileToOpen = `code_snippet_${Date.now()}.${language || 'txt'}`;
      }
    } else if (action === 'run' && !fileToOpen.endsWith('.py')) {
      // If running a non-Python file, add .py extension
      fileToOpen = `${fileToOpen}.py`;
    }

    console.log(`Opening file in IDE: ${fileToOpen}, action: ${action}`);

    // Store data in both sessionStorage and localStorage for redundancy
    const fileData = {
      project: projectName,
      fileName: fileToOpen,
      content: code,
      action: action,
      // Add a timestamp to ensure uniqueness
      timestamp: Date.now()
    };

    // Use sessionStorage as primary and localStorage as backup
    sessionStorage.setItem('ide_file_data', JSON.stringify(fileData));
    localStorage.setItem('ideFileToOpen', JSON.stringify(fileData));

    // Navigate to IDE
    window.location.href = '/ide';
  };

  return (
    <pre className="code-block">
      <div className="file-actions">
        <button
          className="file-action-button edit"
          title="Edit in IDE"
          onClick={(e) => handleIDENavigation('edit', e)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className="file-action-button run"
          title="Run in IDE"
          onClick={(e) => handleIDENavigation('run', e)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <code className={language ? `language-${language}` : ''}>{code}</code>
    </pre>
  );
};

export default CodeBlock;



