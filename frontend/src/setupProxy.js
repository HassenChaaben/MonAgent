const { createProxyMiddleware } = require('http-proxy-middleware');

// This is a workaround to suppress the deprecation warnings
// without changing the application functionality
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '';
process.env.NODE_OPTIONS += ' --no-deprecation';

module.exports = function (app) {
  // Proxy API requests to the backend server
  app.use(
    ['/admin', '/tasks', '/workspace', '/config', '/download'],
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
    })
  );
};
