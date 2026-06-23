import React, { useState, useEffect } from 'react';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes().toString().padStart(2, '0');
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  if (hh > 0) {
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
};

const TimelineScrubber = ({ currentTime, duration, onSeek, isPaused }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    // Only update the slider's position from props if the user is not actively scrubbing.
    if (!isScrubbing) {
      setSliderValue(currentTime);
    }
  }, [currentTime, isScrubbing]);

  const handleScrubStart = () => {
    setIsScrubbing(true);
  };

  const handleScrubEnd = (e) => {
    setIsScrubbing(false);
    const newTime = parseFloat(e.target.value);
    onSeek(newTime);
  };

  const handleScrubChange = (e) => {
    setSliderValue(parseFloat(e.target.value));
  };

  return (
    <div className="timeline-scrubber-container">
      <span>{formatTime(sliderValue)}</span>
      <input
        type="range"
        min="0"
        max={duration || 0}
        value={sliderValue || 0}
        step="0.1"
        className="timeline-scrubber"
        onMouseDown={handleScrubStart}
        onMouseUp={handleScrubEnd}
        onTouchStart={handleScrubStart}
        onTouchEnd={handleScrubEnd}
        onChange={handleScrubChange}
        disabled={!duration}
      />
      <span>{formatTime(duration)}</span>
    </div>
  );
};

export default TimelineScrubber;
