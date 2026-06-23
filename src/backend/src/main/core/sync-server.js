const { randomUUID } = require('crypto');
const WebSocket = require('ws');

const clients = new Map();
const stateListeners = new Set();
let wss;

function emitStateChange() {
  const snapshot = {
    playbackState: getPlaybackState(),
    streams: getClientStates(),
  };

  stateListeners.forEach((listener) => listener(snapshot));
}

function getMetadataByClientId(clientId) {
  for (const metadata of clients.values()) {
    if (metadata.id === clientId) {
      return metadata;
    }
  }

  return null;
}

/**
 * Broadcasts a message to all connected clients.
 * @param {object} message The message object to send.
 */
function broadcast(message) {
  const serializedMessage = JSON.stringify(message);
  clients.forEach((metadata) => {
    const { socket: ws } = metadata;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(serializedMessage);
    }
  });
}

function sendToClient(clientId, message) {
  const metadata = getMetadataByClientId(clientId);
  if (!metadata || metadata.socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  metadata.socket.send(JSON.stringify(message));
  return true;
}

function getClientStates() {
  return Array.from(clients.values())
    .sort((left, right) => left.connectedAt - right.connectedAt)
    .map(({ socket, ...metadata }) => ({ ...metadata }));
}

function getPlaybackState() {
  const states = getClientStates();
  if (states.length === 0) {
    return { currentTime: 0, duration: 0, isPaused: true };
  }

  const currentTimes = states
    .map((state) => state.currentTime)
    .filter((value) => Number.isFinite(value));
  const durations = states
    .map((state) => state.duration)
    .filter((value) => Number.isFinite(value) && value > 0);

  return {
    currentTime: currentTimes.length === 0 ? 0 : currentTimes.reduce((sum, value) => sum + value, 0) / currentTimes.length,
    duration: durations.length === 0 ? 0 : Math.max(...durations),
    isPaused: states.every((state) => state.isPaused),
  };
}

/**
 * Starts the WebSocket server.
 * @param {object} options
 * @param {number} options.port The port to listen on.
 */
function startServer({ port = 0, host = '127.0.0.1' } = {}) {
  if (wss) {
    return Promise.resolve(getServerInfo());
  }

  return new Promise((resolve, reject) => {
    wss = new WebSocket.Server({ port, host });

    wss.once('listening', () => {
      const info = getServerInfo();
      console.log(`Sync WebSocket Server started on ${info.host}:${info.port}`);
      resolve(info);
    });

    wss.once('error', (error) => {
      reject(error);
    });

    wss.on('connection', (ws) => {
      const clientId = randomUUID();
      console.log('Client connected:', clientId);

      clients.set(ws, {
        socket: ws,
        id: clientId,
        connectedAt: Date.now(),
        currentTime: 0,
        duration: 0,
        isPaused: true,
        volume: 1,
      });
      emitStateChange();

      ws.send(JSON.stringify({ type: 'INIT', payload: { clientId } }));

      ws.on('message', (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          const metadata = clients.get(ws);
          if (!metadata) {
            return;
          }

          if (parsedMessage.type === 'STATUS_UPDATE' && parsedMessage.payload) {
            metadata.currentTime = parsedMessage.payload.currentTime ?? metadata.currentTime;
            metadata.duration = parsedMessage.payload.duration ?? metadata.duration;
            metadata.isPaused = parsedMessage.payload.isPaused ?? metadata.isPaused;
            metadata.volume = parsedMessage.payload.volume ?? metadata.volume;
            metadata.lastUpdateAt = Date.now();
            emitStateChange();
          }
        } catch (error) {
          console.error(`Failed to parse message from ${clientId}:`, error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected:', clientId);
        clients.delete(ws);
        emitStateChange();
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        clients.delete(ws);
        emitStateChange();
      });
    });

    wss.on('error', (error) => {
      console.error('Sync WebSocket Server error:', error);
    });
  });
}

function getServerInfo() {
  if (!wss) {
    return null;
  }

  const address = wss.address();
  if (!address || typeof address === 'string') {
    return null;
  }

  return {
    host: address.address,
    port: address.port,
    websocketUrl: `ws://${address.address}:${address.port}`,
  };
}

function stopServer() {
  if (!wss) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const server = wss;
    wss = null;

    clients.clear();
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

module.exports = {
  startServer,
  broadcast,
  getClientStates,
  getPlaybackState,
  getServerInfo,
  getClients: () => clients,
  onStateChange: (listener) => {
    stateListeners.add(listener);
    return () => stateListeners.delete(listener);
  },
  sendToClient,
  stopServer,
};
