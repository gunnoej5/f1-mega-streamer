import React, { useState, useEffect } from 'react';
import TimelineScrubber from './components/TimelineScrubber';
import StreamControls from './components/StreamControls';

const DEFAULT_STREAM_URL = 'https://f1tv.formula1.com/';

function App() {
  const [playbackState, setPlaybackState] = useState({
    currentTime: 0,
    duration: 0,
    isPaused: true,
  });
  const [streams, setStreams] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const handlePlaybackStateUpdate = (state) => {
      setPlaybackState({
        currentTime: typeof state.currentTime === 'number' ? state.currentTime : 0,
        duration: typeof state.duration === 'number' ? state.duration : 0,
        isPaused: typeof state.isPaused === 'boolean' ? state.isPaused : true,
      });
    };

    const handleStreamsStateUpdate = (streamsState) => {
      setStreams(Array.isArray(streamsState) ? streamsState : []);
    };

    const unsubscribePlayback = window.electronAPI.on('playback-state-update', handlePlaybackStateUpdate);
    const unsubscribeStreams = window.electronAPI.on('streams-state-update', handleStreamsStateUpdate);

    window.electronAPI.invoke('get-initial-state').then((initialState) => {
      if (!isMounted || !initialState) {
        return;
      }

      handlePlaybackStateUpdate(initialState.playbackState || {});
      handleStreamsStateUpdate(initialState.streams || []);
    }).catch((error) => {
      console.error('Failed to fetch initial state:', error);
    });

    return () => {
      isMounted = false;
      unsubscribePlayback();
      unsubscribeStreams();
    };
  }, []);

  const handleSeek = (newTime) => {
    window.electronAPI.invoke('seek-all', newTime);
  };
  
  const handlePlayPause = () => {
    if (playbackState.isPaused) {
      window.electronAPI.invoke('play-all');
    } else {
      window.electronAPI.invoke('pause-all');
    }
  };

  const handleVolumeChange = (streamId, newVolume) => {
    window.electronAPI.invoke('set-stream-volume', { streamId, volume: newVolume });
  };

  const handleAddStream = () => {
    window.electronAPI.invoke('add-stream', DEFAULT_STREAM_URL);
  };

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
