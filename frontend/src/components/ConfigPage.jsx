import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar,
  IconButton,
  createTheme,
  ThemeProvider,
  CssBaseline
} from '@mui/material';
import Navigation from './Navigation';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ApiIcon from '@mui/icons-material/Api';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import '../styles/ConfigPage.css';

// SVG Icons for theme toggle
const LightModeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="#0284c7" />
    <path d="M12 1V3" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 21V23" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    <path d="M23 12H21" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 12H1" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    <path d="M19.7778 4.22266L18.3636 5.63687" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    <path d="M5.63604 18.3638L4.22183 19.778" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    <path d="M19.7778 19.7783L18.3636 18.3641" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    <path d="M5.63604 5.63715L4.22183 4.22294" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DarkModeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#F9A825" stroke="#F9A825" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ConfigPage({ isDarkMode, toggleTheme }) {
  // Create a custom theme based on dark/light mode
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#0284c7' : '#38A169', // Changed to blue neon for dark mode
      },
      background: {
        default: isDarkMode ? '#0f1624' : '#f7fafc',
        paper: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#1a202c',
        secondary: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#4a5568',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : '#f8fafc',
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            color: isDarkMode ? '#0284c7' : '#38A169',
            '&.Mui-checked': {
              color: isDarkMode ? '#0ea5e9' : '#48BB78',
            },
            '&.Mui-checked + .MuiSwitch-track': {
              backgroundColor: isDarkMode ? '#0284c7' : '#38A169',
            },
          },
          track: {
            backgroundColor: isDarkMode ? 'rgba(2, 132, 199, 0.5)' : 'rgba(56, 161, 105, 0.5)',
          },
        },
      },
    },
  });

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    llm: { model: '', base_url: '', api_key: '', max_tokens: '', temperature: '' }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [exampleApiKey, setExampleApiKey] = useState('');

  useEffect(() => {
    fetchConfigStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfigStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/config/status');
      const data = await response.json();

      if (data.status === 'exists' && data.config) {
        populateConfig(data.config);
      } else if (data.status === 'missing' && data.example_config) {
        populateConfig(data.example_config);
        setExampleApiKey(data.example_config.llm?.api_key || '');
      } else if (data.status === 'no_example') {
        setError('Error: Missing configuration example file! Please ensure that the config/config.example.toml file exists.');
      } else if (data.status === 'error') {
        setError('Configuration error: ' + data.message);
      } else {
        setError('Unable to load configuration. Please check if config.example.toml exists.');
      }
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
      setError('Failed to load configuration. Please check if the server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  const populateConfig = (configData) => {
    setConfig({
      llm: {
        model: configData.llm?.model || '',
        base_url: configData.llm?.base_url || '',
        api_key: configData.llm?.api_key || '',
        max_tokens: configData.llm?.max_tokens || '',
        temperature: configData.llm?.temperature || '',
      }
    });
  };

  const handleChange = (section, field, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [section]: {
        ...prevConfig[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    const { llm } = config;
    const requiredFields = [
      { value: llm.model, name: 'Model Name' },
      { value: llm.base_url, name: 'API Base URL' },
      { value: llm.api_key, name: 'API Key' }
    ];

    const missingFields = requiredFields.filter(field => !String(field.value).trim());
    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.map(f => f.name).join(', ')}`);
      return;
    }

    // Check if API key is the example one
    if (llm.api_key.trim() === exampleApiKey && exampleApiKey.includes('sk-')) {
      setError('Please enter your own API key.');
      return;
    }

    // Prepare data for saving
    const saveData = {
      llm: {
        model: llm.model.trim(),
        base_url: llm.base_url.trim(),
        api_key: llm.api_key.trim(),
        ...(llm.max_tokens && { max_tokens: parseInt(llm.max_tokens, 10) }),
        ...(llm.temperature && { temperature: parseFloat(llm.temperature) }),
      }
    };

    try {
      const response = await fetch('/config/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData)
      });

      const result = await response.json();

      if (result.status === 'success') {
        setSuccess(true);
      } else {
        setError(`Save failed: ${result.message}`);
      }
    } catch (err) {
      setError(`Request error: ${err.message}`);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={`${!isDarkMode ? 'light-mode' : ''}`} style={{ overflow: 'hidden' }}>
        <Navigation isDarkMode={isDarkMode} />
        <div className="config-page">
          {/* Theme toggle button */}
          <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </button>

          {/* Decorative elements */}
          <div className="config-decoration config-decoration-1"></div>
          <div className="config-decoration config-decoration-2"></div>

          <Container maxWidth="md">
            <div className="config-header">
              <div className="logo-container">
                {/* <div className="logo-icon">AI</div> */}
                <Typography variant="h3" component="h1" className="config-title">
                  Configuration
                </Typography>
              </div>
              <Typography variant="body1" className="config-description">
                Configure your LLM API settings and server configuration. These settings will be saved to the config.toml file and used by the application.
              </Typography>
            </div>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)'
                }}
              >
                {error}
              </Alert>
            )}

            <Paper elevation={3} className="config-paper" sx={{ backgroundColor: 'transparent' }}>
              {loading ? (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" my={8}>
                  <CircularProgress size={60} thickness={4} sx={{ color: isDarkMode ? '#06b6d4' : '#38A169' }} />
                  <Typography variant="h6" sx={{ mt: 3, fontWeight: 500 }}>
                    Loading configuration...
                  </Typography>
                </Box>
              ) : (
                <form onSubmit={handleSubmit} className="config-form">
                  <div className="config-section">
                    <Typography variant="h5" className="config-section-title">
                      <ApiIcon sx={{ mr: 1 }} /> LLM Settings
                    </Typography>

                    <Grid container spacing={2} className="config-grid-container">
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Model Name *"
                          value={config.llm.model}
                          onChange={(e) => handleChange('llm', 'model', e.target.value)}
                          margin="normal"
                          helperText="The LLM model to use (e.g., gpt-4o, claude-3-7-sonnet-20250219)"
                          variant="outlined"
                          InputProps={{
                            sx: {
                              color: isDarkMode ? '#ffffff' : '#1a202c',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: isDarkMode ? '#06b6d4' : '#38A169',
                              },
                            }
                          }}
                          InputLabelProps={{
                            sx: { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#4a5568' }
                          }}
                          FormHelperTextProps={{
                            sx: { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#718096' }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="API Base URL *"
                          value={config.llm.base_url}
                          onChange={(e) => handleChange('llm', 'base_url', e.target.value)}
                          margin="normal"
                          helperText="The base URL for the API (e.g., https://api.openai.com/v1)"
                          variant="outlined"
                          InputProps={{
                            sx: {
                              color: isDarkMode ? '#ffffff' : '#1a202c',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: isDarkMode ? '#06b6d4' : '#38A169',
                              },
                            }
                          }}
                          InputLabelProps={{
                            sx: { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#4a5568' }
                          }}
                          FormHelperTextProps={{
                            sx: { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#718096' }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="API Key *"
                          type="password"
                          value={config.llm.api_key}
                          onChange={(e) => handleChange('llm', 'api_key', e.target.value)}
                          margin="normal"
                          helperText="Your API key for authentication"
                          variant="outlined"
                          InputProps={{
                            sx: {
                              color: isDarkMode ? '#ffffff' : '#1a202c',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: isDarkMode ? '#06b6d4' : '#38A169',
                              },
                            }
                          }}
                          InputLabelProps={{
                            sx: { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#4a5568' }
                          }}
                          FormHelperTextProps={{
                            sx: { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#718096' }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Max Tokens"
                          type="number"
                          value={config.llm.max_tokens}
                          onChange={(e) => handleChange('llm', 'max_tokens', e.target.value)}
                          margin="normal"
                          helperText="Maximum number of tokens in the response"
                          variant="outlined"
                          InputProps={{
                            sx: {
                              color: isDarkMode ? '#ffffff' : '#1a202c',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: isDarkMode ? '#06b6d4' : '#38A169',
                              },
                            }
                          }}
                          InputLabelProps={{
                            sx: { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#4a5568' }
                          }}
                          FormHelperTextProps={{
                            sx: { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#718096' }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Temperature"
                          type="number"
                          inputProps={{ step: 0.1, min: 0, max: 2 }}
                          value={config.llm.temperature}
                          onChange={(e) => handleChange('llm', 'temperature', e.target.value)}
                          margin="normal"
                          helperText="Controls randomness (0.0 to 2.0)"
                          variant="outlined"
                          InputProps={{
                            sx: {
                              color: isDarkMode ? '#ffffff' : '#1a202c',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: isDarkMode ? '#06b6d4' : '#38A169',
                              },
                            }
                          }}
                          InputLabelProps={{
                            sx: { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#4a5568' }
                          }}
                          FormHelperTextProps={{
                            sx: { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#718096' }
                          }}
                        />
                      </Grid>

                      {/* Empty grid item to maintain 2-column layout */}
                      <Grid item xs={12} md={6}>
                        {/* This empty space ensures proper alignment */}
                      </Grid>
                    </Grid>
                  </div>



                  <Box mt={5} display="flex" justifyContent="flex-end">
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      size="large"
                      className="save-button"
                      startIcon={<CloudDoneIcon />}
                    >
                      Save Configuration
                    </Button>
                  </Box>
                </form>
              )}
            </Paper>

            <Snackbar
              open={success}
              autoHideDuration={6000}
              onClose={handleCloseSnackbar}
              sx={{
                '& .MuiSnackbarContent-root': {
                  backgroundColor: isDarkMode ? '#06b6d4' : '#38A169',
                  borderRadius: '8px',
                  boxShadow: isDarkMode ? '0 4px 12px rgba(6, 182, 212, 0.3)' : '0 4px 12px rgba(56, 161, 105, 0.3)'
                }
              }}
              message={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ mr: 1 }} />
                  Configuration saved successfully!
                </Box>
              }
              action={
                <IconButton size="small" color="inherit" onClick={handleCloseSnackbar}>
                  ×
                </IconButton>
              }
            />
          </Container>
        </div>
      </div>
    </ThemeProvider>
  );
}
