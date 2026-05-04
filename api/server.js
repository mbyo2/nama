import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import the built server
const server = require('../dist/server/server.js');

export default async function handler(req, res) {
  try {
    // Convert Vercel request to the format expected by TanStack Start
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Call the TanStack Start server
    const response = await server.fetch(request);
    
    // Convert response back to Vercel format
    res.status(response.status);
    
    // Set headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Send response body
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Internal Server Error');
  }
}
