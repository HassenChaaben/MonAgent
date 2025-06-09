import React from 'react';

/**
 * ProjectBanner component - Displays a fixed banner at the top of the chat
 * showing project creation information
 * 
 * @param {Object} props - Component props
 * @param {string} props.projectName - The name of the current project
 * @param {boolean} props.isDarkMode - Whether dark mode is enabled
 * @returns {JSX.Element} - The rendered component
 */
const ProjectBanner = ({ projectName, isDarkMode }) => {
  if (!projectName) return null;

  return (
    <div className={`project-banner ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="project-banner-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M3 5C3 3.89543 3.89543 3 5 3H9.5C10.0304 3 10.5391 3.21071 10.9142 3.58579L12.5 5.17157C12.8751 5.54664 13.3838 5.75736 13.9142 5.75736H19C20.1046 5.75736 21 6.65279 21 7.75736V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>
      <div className="project-banner-content">
        <span className="project-banner-title">Project: <strong>{projectName}</strong></span>
        <span className="project-banner-description">
          All files for this conversation will be organized in this project folder.
        </span>
      </div>
    </div>
  );
};

export default ProjectBanner;
