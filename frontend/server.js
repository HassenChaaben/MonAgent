const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Proxy API requests to the backend server
// The backend port is always 8080
const apiProxy = createProxyMiddleware(['/tasks', '/workspace', '/config/save', '/config/status', '/download', '/admin/api'], {
  target: 'http://localhost:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/workspace/([^/]+)/react/start': '/workspace/$1/react/start?port=3001' // Ensure React apps always start on port 3001
  }
});

app.use(apiProxy);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// For any request that doesn't match one above, send back React's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Open http://localhost:${port} in your browser`);
});
