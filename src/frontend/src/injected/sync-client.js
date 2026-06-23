(function() {
    console.log('[F1TV-Sync] Injected client script running.');

    const WEBSOCKET_URL = 'ws://localhost:8080'; // This port must match the server in the Electron app
    const VIDEO_SELECTOR = 'video.vjs-tech'; // A common selector for video.js players
    const RETRY_INTERVAL_MS = 500;
    const TIME_REPORT_INTERVAL_MS = 250;

    let videoElement = null;
    let ws = null;
    let reportingInterval = null;

    /**
     * T05: Find the main video element on the page, with retries.
     */
    function findVideoElement() {
        console.log('[F1TV-Sync] Searching for video element...');
        videoElement = document.querySelector(VIDEO_SELECTOR);

        if (videoElement) {
            console.log('[F1TV-Sync] Video element found:', videoElement);
            connectWebSocket();
        } else {
            console.log(`[F1TV-Sync] Video element not found. Retrying in ${RETRY_INTERVAL_MS}ms.`);
            setTimeout(findVideoElement, RETRY_INTERVAL_MS);
        }
    }

    /**
     * T05: Connect to the WebSocket server, with reconnection logic.
     */
    function connectWebSocket() {
        console.log(`[F1TV-Sync] Connecting to WebSocket server at ${WEBSOCKET_URL}...`);
        ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log('[F1TV-Sync] WebSocket connection established.');
            startReporting();
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleCommand(message);
            } catch (error) {
                console.error('[F1TV-Sync] Error parsing incoming message:', error);
            }
        };

        ws.onclose = () => {
            console.log('[F1TV-Sync] WebSocket connection closed. Attempting to reconnect...');
            stopReporting();
            setTimeout(connectWebSocket, 2000); // Reconnect after 2 seconds
        };

        ws.onerror = (error) => {
            console.error('[F1TV-Sync] WebSocket error:', error);
            // onclose will be called next, which handles reconnection.
        };
    }

    /**
     * T06: Handle playback commands from the server.
     */
    function handleCommand(message) {
        if (!videoElement) {
            console.warn('[F1TV-Sync] Received command but video element is not available.');
            return;
        }

        console.log('[F1TV-Sync] Received command:', message);

        switch (message.type) {
            case 'PLAY':
                videoElement.play();
                break;
            case 'PAUSE':
                videoElement.pause();
                break;
            case 'SEEK':
                if (message.payload && typeof message.payload.time === 'number') {
                    videoElement.currentTime = message.payload.time;
                }
                break;
            case 'SET_VOLUME':
                 if (message.payload && typeof message.payload.volume === 'number') {
                    videoElement.volume = message.payload.volume;
                }
                break;
            default:
                console.warn('[F1TV-Sync] Unknown command type:', message.type);
        }
    }

    /**
     * T07: Periodically report video status back to the server.
     */
    function startReporting() {
        if (reportingInterval) {
            clearInterval(reportingInterval);
        }
        reportingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN && videoElement) {
                const message = {
                    type: 'STATUS_UPDATE',
                    payload: {
                        currentTime: videoElement.currentTime,
                        duration: videoElement.duration,
                        isPaused: videoElement.paused,
                        volume: videoElement.volume,
                    }
                };
                ws.send(JSON.stringify(message));
            }
        }, TIME_REPORT_INTERVAL_MS);
    }

    function stopReporting() {
        if (reportingInterval) {
            clearInterval(reportingInterval);
            reportingInterval = null;
        }
    }

    // Start the process
    findVideoElement();

})();
