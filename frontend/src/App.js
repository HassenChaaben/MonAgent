import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import ConfigPage from './components/ConfigPage';
import OldChat from './components/Chat';
import Chat from './components/NewChat';
import IDE from './components/IDE';
import Navigation from './components/Navigation';
import AdminDashboard from './components/AdminDashboard';
import DocumentationPage from './components/DocumentationPage';
import AboutPage from './components/AboutPage';
import './styles/App.css';
import './styles/NeonTheme.css';
import './styles/ScrollFix.css';
import './styles/ThemeOverrides.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Router>
      <div className={`App ${!isDarkMode ? 'light-mode' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
          <Route path="/config" element={<ConfigPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
          <Route path="/chat" element={
            <>
              <Navigation isDarkMode={isDarkMode} />
              <Chat isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            </>
          } />
          <Route path="/chat/:taskId" element={
            <>
              <Navigation isDarkMode={isDarkMode} />
              <Chat isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            </>
          } />
          <Route path="/ide" element={
            <>
              <Navigation isDarkMode={isDarkMode} />
              <IDE isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            </>
          } />
          <Route path="/admin" element={
            <>
              <Navigation isDarkMode={isDarkMode} />
              <AdminDashboard isDarkMode={isDarkMode} />
            </>
          } />
          <Route path="/documentation" element={
            <>
              <Navigation isDarkMode={isDarkMode} />
              <DocumentationPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            </>
          } />
          <Route path="/about" element={
            <>
              <Navigation isDarkMode={isDarkMode} />
              <AboutPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            </>
          } />
          {/* Fallback route for any unmatched routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
