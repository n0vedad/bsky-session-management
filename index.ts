// index.ts
import http from 'http';
import dotenv from 'dotenv';
import { initializeSessionData, ensureValidSession } from './sessionManager';

// Load environment variables
dotenv.config();

/**
 * Check if the app password is valid.
 * @param {string} appPassword - The app password to validate.
 * @returns {boolean} True if the app password is valid, false otherwise.
 */
const isValidAppPassword = (appPassword: string): boolean => /^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(appPassword);

// Main function for handling server
export function startServer() {

  // Check if environment variables are set
  if (!process.env.IDENTIFIER || !process.env.PASSWORD) {
    console.error('Environment variables IDENTIFIER and PASSWORD must be set');
    process.exit(1);
  }

  // Check if the PASSWORD follows the required format
  if (!isValidAppPassword(process.env.PASSWORD)) {
    console.error('The PASSWORD environment variable must contain a Bluesky app password');
    process.exit(1);
  }

  // Create an HTTP server to handle requests
  const server = http.createServer(async (request, response) => {
    // Ignore favicon requests (sending 204 = No Content)
    if (request.url === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }

    // Log the received request
    const currentDateTime = new Date().toISOString();
    console.log(`Received ${request.method} request for ${request.url} at ${currentDateTime}\n`);

    // Begin data validation
    const cookies = request.headers['cookie'];
    try {
      // Initialize sessionData
      const { sessionData, tokensUpdated } = await initializeSessionData(cookies, response);

      // Ensure the session is valid only if tokens were not just create
      if (!tokensUpdated && cookies) {
        console.log('Cookies present, calling ensureValidSession', '\n');
        await ensureValidSession(sessionData);
      }

      // End the response with a simple message
      response.end('Hello World!');

      // Main error handling
    } catch (error) {
      console.error('Failed to initialize session:', error, '\n');
      response.statusCode = 500;
      response.end('Internal Server Error');
    }
  });

  // Start the server on port 3000
  server.listen(3000, () => {
    console.log('Server listening on port 3000', '\n');
  });

  return server;
}

// Start the server
if (require.main === module) {
  startServer();
}