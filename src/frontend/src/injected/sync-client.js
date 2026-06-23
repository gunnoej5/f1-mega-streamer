function buildInjectedSyncClient({ websocketUrl }) {
    const config = JSON.stringify({ websocketUrl });

    return `(() => {
        const CONFIG = ${config};
        const VIDEO_SELECTOR = 'video, video.vjs-tech';
        const RETRY_INTERVAL_MS = 500;
        const RECONNECT_INTERVAL_MS = 2000;
        const STATUS_REPORT_INTERVAL_MS = 500;

        if (window.__F1TV_SYNC_CLIENT_INSTALLED__) {
            return;
        }

        Object.defineProperty(window, '__F1TV_SYNC_CLIENT_INSTALLED__', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false,
        });

        let videoElement = null;
        let ws = null;
        let reportingInterval = null;
        let reconnectTimer = null;
        let videoRetryTimer = null;

        function getVideoElement() {
            return document.querySelector(VIDEO_SELECTOR);
        }

        function scheduleVideoRetry() {
            if (videoRetryTimer) {
                return;
            }

            videoRetryTimer = setTimeout(() => {
                videoRetryTimer = null;
                findVideoElement();
            }, RETRY_INTERVAL_MS);
        }

        function findVideoElement() {
            videoElement = getVideoElement();

            if (!videoElement) {
                scheduleVideoRetry();
                return;
            }

            connectWebSocket();
            startReporting();
        }

        function scheduleReconnect() {
            if (reconnectTimer) {
                return;
            }

            reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                connectWebSocket();
            }, RECONNECT_INTERVAL_MS);
        }

        function connectWebSocket() {
            if (!videoElement) {
                findVideoElement();
                return;
            }

            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                return;
            }

            ws = new WebSocket(CONFIG.websocketUrl);

            ws.onopen = () => {
                startReporting();
            };

            ws.onmessage = (event) => {
                try {
                    handleCommand(JSON.parse(event.data));
                } catch (error) {
                    console.error('[F1TV-Sync] Failed to process command:', error);
                }
            };

            ws.onclose = () => {
                stopReporting();
                scheduleReconnect();
            };

            ws.onerror = () => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            };
        }

        function handleCommand(message) {
            if (!videoElement) {
                return;
            }

            switch (message.type) {
                case 'PLAY': {
                    const playPromise = videoElement.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch(() => {});
                    }
                    break;
                }
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
                    break;
            }
        }

        function startReporting() {
            if (!videoElement) {
                return;
            }

            if (reportingInterval) {
                clearInterval(reportingInterval);
            }

            reportingInterval = setInterval(() => {
                if (!videoElement) {
                    videoElement = getVideoElement();
                }

                if (!videoElement || !ws || ws.readyState !== WebSocket.OPEN) {
                    return;
                }

                ws.send(JSON.stringify({
                    type: 'STATUS_UPDATE',
                    payload: {
                        currentTime: videoElement.currentTime,
                        duration: videoElement.duration,
                        isPaused: videoElement.paused,
                        volume: videoElement.volume,
                    },
                }));
            }, STATUS_REPORT_INTERVAL_MS);
        }

        function stopReporting() {
            if (reportingInterval) {
                clearInterval(reportingInterval);
                reportingInterval = null;
            }
        }

        findVideoElement();
    })();`;
}

module.exports = { buildInjectedSyncClient };
