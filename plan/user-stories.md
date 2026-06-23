# F1 Mega Streamer User Stories

## Story Format

Each story includes a stable ID, a user-centered goal, and concrete acceptance criteria that can be translated into tickets or test cases.

## US-01 Platform Support

**As an** F1 fan  
**I want** to run the application on my Windows or macOS computer  
**So that** I can use my preferred machine for watching races.

### Acceptance Criteria

- The application installs and runs on Windows 11.
- The application installs and runs on a modern version of macOS.
- The application can launch and control both Chrome and Brave browser windows.

## US-02 External Browser Utility Model

**As an** F1 fan  
**I want** a utility that arranges and controls separate browser windows  
**So that** I can use the standard, full-featured browser experience I am familiar with.

### Acceptance Criteria

- The application does not use its own embedded browser panes as the primary viewing surface.
- The application launches instances of a supported installed browser.
- The application provides a control interface separate from the browser windows themselves.

## US-03 Stream Pop-Out Workflow

**As an** F1 fan  
**I want** to select a stream from the F1TV interface and pop it out into a new window  
**So that** I can easily build my preferred multi-view layout.

### Acceptance Criteria

- While viewing F1TV, I can trigger a pop-out action for an alternative feed.
- The action launches a new browser window with the selected feed.
- The new window is automatically registered with the utility for synchronized control.
- The utility supports up to six simultaneous managed stream windows.

## US-04 Master Playback Control

**As an** F1 fan  
**I want** a master play/pause button and timeline scrubber  
**So that** I can control all streams simultaneously to analyze a specific moment.

### Acceptance Criteria

- When I press the master pause button, all managed video streams pause within 0.5 seconds of each other.
- When I press the master play button, all managed video streams resume playback.
- When I drag the master timeline scrubber, all managed video streams seek to the selected timestamp.
- After seeking, the time difference between any two managed streams is less than 0.5 seconds.

## US-05 Per-Stream Volume Control

**As an** F1 fan  
**I want** a central volume mixer for all my streams  
**So that** I can adjust audio levels without hunting for the right window.

### Acceptance Criteria

- The control interface displays a volume slider for each active stream.
- Adjusting a slider changes the volume of the corresponding stream's browser window.

## Suggested Epic Grouping

- `EPIC-1`: Desktop foundation and browser launch support.
- `EPIC-2`: Stream discovery, pop-out, and window registration.
- `EPIC-3`: Synchronization and master playback controls.
- `EPIC-4`: Audio mixing and quality-of-life controls.
