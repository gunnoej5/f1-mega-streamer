const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Using a Map to hold client connections and their state
const clients = new Map();
let wss;

/**
 * Broadcasts a message to all connected clients.
 * @param {object} message The message object to send.
 */
function broadcast(message) {
  const serializedMessage = JSON.stringify(message);
  clients.forEach((metadata, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(serializedMessage);
    }
  });
}

/**
 * Starts the WebSocket server.
 * @param {object} options
 * @param {number} options.port The port to listen on.
 */
function startServer({ port }) {
  wss = new WebSocket.Server({ port });

  wss.on('listening', () => {
    console.log(`Sync WebSocket Server started on port ${port}`);
  });

  wss.on('connection', (ws) => {
    const clientId = uuidv4();
    console.log('Client connected:', clientId);

    // Register the new client
    clients.set(ws, { id: clientId });

    // Send an initial message to the client with its assigned ID
    ws.send(JSON.stringify({ type: 'INIT', payload: { clientId } }));

    ws.on('message', (message) => {
      // Basic message handling structure
      try {
        const parsedMessage = JSON.parse(message);
        console.log(`Received from ${clientId}:`, parsedMessage);
        // Further message processing will be added later
      } catch (error) {
        console.error(`Failed to parse message from ${clientId}:`, error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected:', clientId);
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      clients.delete(ws);
    });
  });

  wss.on('error', (error) => {
    console.error('Sync WebSocket Server error:', error);
  });
}

module.exports = {
  startServer,
  broadcast,
  getClients: () => clients,
};
