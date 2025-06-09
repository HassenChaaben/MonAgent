import React, { useState, useEffect } from 'react';
import { Button, TextField, Modal, Box, Typography, Alert } from '@mui/material';
import '../styles/ConfigModal.css'; // Create this CSS file if needed

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function ConfigModal({ open, onClose, onSave, exampleConfig }) {
  const [config, setConfig] = useState({
    llm: { model: '', base_url: '', api_key: '', max_tokens: '', temperature: '' },
    server: { host: '', port: '' }
  });
  const [error, setError] = useState('');
  const [exampleApiKey, setExampleApiKey] = useState('');

  useEffect(() => {
    if (exampleConfig) {
      setConfig({
        llm: {
          model: exampleConfig.llm?.model || '',
          base_url: exampleConfig.llm?.base_url || '',
          api_key: exampleConfig.llm?.api_key || '',
          max_tokens: exampleConfig.llm?.max_tokens || '',
          temperature: exampleConfig.llm?.temperature || '',
        },
        server: {
          host: exampleConfig.server?.host || '',
          port: exampleConfig.server?.port || '',
        }
      });
      setExampleApiKey(exampleConfig.llm?.api_key || '');
    }
  }, [exampleConfig, open]); // Re-populate when modal opens or exampleConfig changes

  const handleChange = (section, key, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [section]: {
        ...prevConfig[section],
        [key]: value
      }
    }));
    setError(''); // Clear error on change
  };

  const handleSave = () => {
    setError('');
    const { llm, server } = config;

    // Basic validation
    const requiredFields = [
      { value: llm.model, name: 'Model Name' },
      { value: llm.base_url, name: 'API Base URL' },
      { value: llm.api_key, name: 'API Key' },
      { value: server.host, name: 'Server Host' },
      { value: server.port, name: 'Server Port' }
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

    // Prepare data for saving (handle potential empty optional fields)
    const saveData = {
        llm: {
            model: llm.model.trim(),
            base_url: llm.base_url.trim(),
            api_key: llm.api_key.trim(),
            ...(llm.max_tokens && { max_tokens: parseInt(llm.max_tokens, 10) }),
            ...(llm.temperature && { temperature: parseFloat(llm.temperature) }),
        },
        server: {
            host: server.host.trim(),
            port: parseInt(server.port, 10) || 5172, // Default port if empty/invalid
        }
    };

    onSave(saveData); // Pass the collected data to the parent component's save handler
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="config-modal-title"
      aria-describedby="config-modal-description"
    >
      <Box sx={style}>
        <Typography id="config-modal-title" variant="h6" component="h2">
          Configuration Required
        </Typography>
        <Typography id="config-modal-description" sx={{ mt: 2 }}>
          Please configure the application settings.
        </Typography>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Box component="form" sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>LLM Settings</Typography>
          <TextField margin="dense" fullWidth label="Model Name *" value={config.llm.model} onChange={(e) => handleChange('llm', 'model', e.target.value)} />
          <TextField margin="dense" fullWidth label="API Base URL *" value={config.llm.base_url} onChange={(e) => handleChange('llm', 'base_url', e.target.value)} />
          <TextField margin="dense" fullWidth label="API Key *" type="password" value={config.llm.api_key} onChange={(e) => handleChange('llm', 'api_key', e.target.value)} />
          <TextField margin="dense" fullWidth label="Max Tokens" type="number" value={config.llm.max_tokens} onChange={(e) => handleChange('llm', 'max_tokens', e.target.value)} />
          <TextField margin="dense" fullWidth label="Temperature" type="number" step="0.1" value={config.llm.temperature} onChange={(e) => handleChange('llm', 'temperature', e.target.value)} />

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Server Settings</Typography>
          <TextField margin="dense" fullWidth label="Server Host *" value={config.server.host} onChange={(e) => handleChange('server', 'host', e.target.value)} />
          <TextField margin="dense" fullWidth label="Server Port *" type="number" value={config.server.port} onChange={(e) => handleChange('server', 'port', e.target.value)} />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>Save Configuration</Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}