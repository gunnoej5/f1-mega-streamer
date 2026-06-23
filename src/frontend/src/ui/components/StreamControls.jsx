import React from 'react';

const StreamVolumeControl = ({ stream, onVolumeChange }) => {
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(stream.id, newVolume);
  };

  return (
    <div className="stream-volume-control">
      <label htmlFor={`volume-${stream.id}`}>Stream {stream.id}</label>
      <input
        type="range"
        id={`volume-${stream.id}`}
        min="0"
        max="1"
        step="0.05"
        value={stream.volume}
        onChange={handleVolumeChange}
      />
      <span>{Math.round(stream.volume * 100)}%</span>
    </div>
  );
};


const StreamControls = ({ streams, onVolumeChange }) => {
  if (!streams || streams.length === 0) {
    return <p>No active streams.</p>;
  }

  return (
    <div className="stream-controls-container">
      <h2>Stream Controls</h2>
      {streams.map(stream => (
        <StreamVolumeControl
          key={stream.id}
          stream={stream}
          onVolumeChange={onVolumeChange}
        />
      ))}
    </div>
  );
};

export default StreamControls;
