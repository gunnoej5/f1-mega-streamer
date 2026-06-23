# F1 Mega Streamer Product Requirements

## 1. Product Summary

F1 Mega Streamer is a desktop utility for Formula 1 fans who want to watch multiple F1TV streams in standard browser windows while keeping playback synchronized. The utility provides centralized controls for playback, seeking, and stream management instead of embedding the video experience inside the application.

## 2. Product Goals

- Support multi-stream F1TV viewing on Windows and macOS.
- Launch and manage standard browser windows rather than embedded web views.
- Let users build a synchronized multi-view setup with up to six streams.
- Keep managed streams aligned closely enough for race analysis and replay review.

## 3. Functional Requirements

### FR-1 Platform Support

- The application must run on Windows 11.
- The application must run on modern versions of macOS.
- The application must support Google Chrome as the primary managed browser.
- The application must support Brave as a secondary managed browser option.

### FR-2 Application Architecture

- The application must act as a utility that launches and manages separate browser windows.
- The application must not rely on embedded browser panes as the primary viewing model.
- The application must provide a control interface that is separate from the managed browser windows.

### FR-3 Stream Management

- The application must support launching and managing up to six simultaneous browser windows for F1TV streams.
- The application must allow a user to select a stream from the F1TV interface and open it in a new managed browser window.
- The application must automatically register newly launched stream windows for centralized control.

### FR-4 Playback Control

- The application must provide master playback controls in a central interface.
- The application must provide a master play action that resumes playback across all managed streams.
- The application must provide a master pause action that pauses playback across all managed streams.
- The application must provide a master timeline scrubber that seeks all managed streams to the same target timestamp.

### FR-5 Synchronization

- The application must maintain time synchronization across all managed streams.
- After play, pause, or seek actions, the time difference between any two managed streams must be less than 0.5 seconds.

## 4. Non-Functional Requirements

### NFR-1 Reliability

- Core playback commands should execute consistently across all managed windows during a viewing session.

### NFR-2 Usability

- Users should be able to manage multi-stream playback from a single control surface without manually adjusting each browser window.

### NFR-3 Compatibility Risk

- Browser automation behavior must tolerate changes in the F1TV website where feasible, but the system depends on F1TV page structure and playback behavior.

## 5. Optional Features

### OF-1 Volume Mixer

- The application should provide a per-stream volume mixer in the central control interface.
- Users should be able to adjust the volume of each active stream without switching browser windows.

## 6. Assumptions And Constraints

- Users must have a valid and active F1TV subscription.
- The application depends on the structure and behavior of the F1TV website.
- The application depends on the availability of a supported installed browser.
- Synchronization quality may vary based on browser behavior, machine performance, and network conditions.

## 7. Suggested Delivery Order

1. Platform and browser launch support.
2. Managed stream window registration.
3. Master play and pause controls.
4. Master timeline scrubbing.
5. Synchronization hardening to meet the 0.5 second tolerance.
6. Optional per-stream volume controls.
