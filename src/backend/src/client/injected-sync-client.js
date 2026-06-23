(() => {
  console.log('Injected Sync Client script executed.');

  const SYNC_SERVER_URL = 'ws://localhost:8080';
  let videoElement = null;
  let clientId = null;
  let ws;

  function findVideoElement() {
    videoElement = document.querySelector('video');
    if (videoElement) {
      console.log('Video element found.');
      connect();
    } else {
      // Retry if the video element isn't available immediately
      setTimeout(findVideoElement, 500);
    }
  }

  function connect() {
    ws = new WebSocket(SYNC_SERVER_URL);

    ws.onopen = () => {
      console.log('Injected Sync Client connected to WebSocket server.');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received command:', message.type);

        switch (message.type) {
          case 'INIT':
            clientId = message.payload.clientId;
            console.log(`Assigned Client ID: ${clientId}`);
            // Start reporting time now that we have an ID
            setInterval(reportTime, 1000); // Report every second
            break;
          // Placeholder for future commands
        }
      } catch (error) {
        console.error('Error processing message from server:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed. Attempting to reconnect...');
      setTimeout(connect, 2000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
  }

  function reportTime() {
    if (ws && ws.readyState === WebSocket.OPEN && videoElement && clientId) {
      const message = {
        type: 'REPORT_TIME',
        payload: {
          clientId,
          currentTime: videoElement.currentTime,
        },
      };
      ws.send(JSON.stringify(message));
    }
  }

  // Start the process
  findVideoElement();
})();
