import React, { useState, useEffect } from 'react';
import TimelineScrubber from './components/TimelineScrubber';
import StreamControls from './components/StreamControls';

function App() {
  // T10 State
  const [playbackState, setPlaybackState] = useState({
    currentTime: 0,
    duration: 0,
    isPaused: true,
  });

  // T13 State
  const [streams, setStreams] = useState([]); // e.g., [{ id: 'client1', volume: 1.0 }]

  useEffect(() => {
    // This listener handles master playback state (time, duration)
    const handlePlaybackStateUpdate = (event, state) => {
      setPlaybackState({
        currentTime: state.currentTime,
        duration: state.duration,
        isPaused: state.isPaused,
      });
    };

    // This listener handles the list of individual streams and their states
    const handleStreamsStateUpdate = (event, streamsState) => {
      setStreams(streamsState); // Expects an array of stream objects
    };

    // Assumes a 'window.electron' object exposed by preload.js
    window.electron.on('playback-state-update', handlePlaybackStateUpdate);
    window.electron.on('streams-state-update', handleStreamsStateUpdate);

    // Request initial state on mount
    window.electron.send('get-initial-state');

    return () => {
      window.electron.removeListener('playback-state-update', handlePlaybackStateUpdate);
      window.electron.removeListener('streams-state-update', handleStreamsStateUpdate);
    };
  }, []);

  // T10 Handler
  const handleSeek = (newTime) => {
    window.electron.send('seek-all', newTime);
  };
  
  const handlePlayPause = () => {
    if (playbackState.isPaused) {
      window.electron.send('play-all');
    } else {
      window.electron.send('pause-all');
    }
  };

  // T13 Handler
  const handleVolumeChange = (streamId, newVolume) => {
    // Send volume change command to the main process for a specific client
    window.electron.send('set-stream-volume', { streamId, volume: newVolume });
  };

  const handleAddStream = () => {
    // Example of how a new stream might be added
    window.electron.send('add-stream', 'https://www.f1.com/en/latest/video.some-race-replay.html');
  }

  return (
    <div className="App">
      <header>
        <h1>F1TV Multi-Stream Sync</h1>
        <button onClick={handleAddStream}>Add Stream</button>
      </header>
      
      <main>
        <div className="master-controls">
          <button onClick={handlePlayPause}>
            {playbackState.isPaused ? 'Play' : 'Pause'}
          </button>
          <TimelineScrubber
            currentTime={playbackState.currentTime}
            duration={playbackState.duration}
            onSeek={handleSeek}
            isPaused={playbackState.isPaused}
          />
        </div>

        <div className="stream-list">
          <StreamControls
            streams={streams}
            onVolumeChange={handleVolumeChange}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
