# F1 Mega Streamer Beta Readiness Plan

## Purpose

This plan combines the current product requirements, user stories, code review findings, and ops artifacts into a single remediation path for getting the project to a beta-quality release.

The immediate goal is not feature expansion. The goal is to fix the known blockers, close the critical security gaps, stabilize the synchronization flow, and prepare a controlled beta deployment with clear entry and exit criteria.

## Inputs

- Product requirements: `plan/requirements.md`
- User stories: `plan/user-stories.md`
- Code review findings: `review/code_review.md`
- Release artifacts and smoke-test flow: `ops/release_plan.json`, `ops/release_report.md`
- Monitoring and alerting baseline: `ops/monitoring_plan.json`, `ops/monitoring_report.md`

## Beta Outcome

A beta build is ready when:

- Core user stories `US-01` through `US-04` are working on supported platforms.
- `US-05` volume control is either fixed and verified or explicitly deferred behind a beta scope note.
- Blocker, critical security, and correctness findings from the review are resolved.
- Packaging, smoke testing, and public artifact publication are repeatable.
- Monitoring and runbooks cover beta installation, launch, orchestration, sync drift, and client error reporting.

## Workstreams

### WS-1 Critical Defects

Focus: restore broken functionality and remove correctness regressions that make the app unreliable.

#### Scope

- Fix `finding-01`: frontend/backend IPC mismatch for volume control.
- Fix `finding-04`: incorrect React `useEffect` cleanup logic.
- Fix `finding-05`: fragile page acquisition and browser orchestration regression.

#### Requirements And Story Coverage

- `FR-3` Stream Management
- `FR-4` Playback Control
- `OF-1` Volume Mixer
- `US-03`, `US-04`, `US-05`

#### Deliverables

- Volume control works end-to-end through the existing control panel.
- React cleanup behavior no longer throws runtime errors during stream add/remove cycles.
- Browser/page acquisition succeeds consistently when opening and registering streams.
- Regression tests or manual test scripts exist for each fixed defect.

### WS-2 Security Hardening

Focus: close the findings that block safe desktop distribution.

#### Scope

- Fix `finding-02`: secure Chrome DevTools Protocol port configuration.
- Fix `finding-03`: stop loading injectable client code from mutable disk paths at runtime.
- Fix `finding-09`: inject backend-provided connection details instead of a hardcoded WebSocket URL.

#### Requirements And Story Coverage

- `FR-2` Application Architecture
- `FR-3` Stream Management
- `NFR-1` Reliability
- `NFR-3` Compatibility Risk
- `US-02`, `US-03`, `US-04`

#### Deliverables

- CDP access is limited to the local application control path and not exposed broadly.
- Injected client assets are packaged in a tamper-resistant way that matches the app build.
- Client connection settings are provided dynamically by the backend at injection time.
- A short security notes section documents the implemented mitigations and remaining assumptions.

### WS-3 Sync And Runtime Robustness

Focus: make the core multi-stream experience stable enough for real beta users.

#### Scope

- Improve `finding-06`: replace naive auto-sync behavior with a more resilient drift-correction approach.
- Fix `finding-07`: reduce or batch high-frequency client status updates.
- Review current sync tolerance against `FR-5` and alert thresholds in `ops/monitoring_plan.json`.

#### Requirements And Story Coverage

- `FR-4` Playback Control
- `FR-5` Synchronization
- `NFR-1` Reliability
- `NFR-2` Usability
- `US-04`

#### Deliverables

- Sync logic handles outlier clients without destabilizing all streams.
- Status reporting is rate-limited or batched to reduce local event pressure.
- Drift is measured in a way that supports both debugging and beta acceptance testing.
- Beta test scenarios define what counts as acceptable sync behavior after play, pause, and seek.

### WS-4 Release Engineering

Focus: convert the prototype into a repeatable packaged beta build.

#### Scope

- Validate the release flow defined in `ops/release_plan.json`.
- Build frontend and backend artifacts in a reproducible way.
- Package signed or at least versioned installers for Windows and macOS.
- Run smoke tests against packaged builds, not just source runs.

#### Requirements And Story Coverage

- `FR-1` Platform Support
- `US-01`

#### Deliverables

- A documented beta build procedure.
- Installable artifacts for target beta platforms.
- A smoke test checklist for first launch, browser detection, stream launch, master controls, and shutdown.
- A rollback procedure for pulling a broken beta artifact.

### WS-5 Beta Operations

Focus: make the release observable and supportable once testers have it.

#### Scope

- Align monitoring thresholds with beta expectations.
- Make sure critical alerts cover launch failures, WebSocket failures, orchestration failures, UI load failures, and sync drift.
- Add a beta feedback loop for defects that come from live tester usage.

#### Requirements And Story Coverage

- `NFR-1` Reliability
- `NFR-2` Usability
- `US-01` through `US-04`

#### Deliverables

- Monitoring checklist updated for beta.
- Runbooks verified for packaging, launch, orchestration, and runtime failures.
- A beta issue triage template for reproductions, logs, browser version, OS version, and stream count.

## Recommended Execution Order

### Phase 1 Blockers And Critical Security

- Complete `finding-01`, `finding-02`, and `finding-03` first.
- Fix `finding-04` and `finding-05` in the same phase because they directly affect basic app stability.
- Do not cut a beta build before this phase is complete.

### Phase 2 Stability And Sync Quality

- Address `finding-06`, `finding-07`, and `finding-09`.
- Add instrumentation needed to measure sync drift and client error rates in realistic sessions.
- Run manual multi-stream validation on both supported browsers where possible.

### Phase 3 Packaging And Beta Validation

- Produce versioned installers.
- Execute source-level and packaged-build smoke tests.
- Verify that monitoring, logs, and release procedures are usable by someone other than the original implementer.

### Phase 4 Limited Beta Release

- Publish beta artifacts to the chosen distribution point.
- Limit initial beta scope to a small tester set.
- Triage incoming defects daily and block broader rollout on crash, launch, sync, or security regressions.

## Beta Entry Criteria

- No open blocker findings.
- No open critical security findings.
- Manual verification passes for:
  - launch on Windows 11
  - launch on modern macOS
  - Chrome stream control
  - Brave stream control
  - multi-stream play and pause
  - timeline scrubbing
- Known issues list is written and included with the beta release.

## Beta Exit Criteria

- Core stories `US-01` through `US-04` pass repeated smoke tests.
- Sync drift remains within target bounds for the defined beta scenarios.
- No high-frequency runtime error pattern appears in beta logs.
- Installer, launch, and stream orchestration failures have working runbooks.
- At least one full release rehearsal succeeds from build through artifact verification.

## Suggested Ticket Breakdown

- `BETA-01` Fix volume IPC mismatch and verify `US-05` acceptance criteria.
- `BETA-02` Repair React cleanup logic for stream lifecycle events.
- `BETA-03` Harden browser/page acquisition and stream registration.
- `BETA-04` Restrict and secure CDP exposure.
- `BETA-05` Embed injected client assets into the packaged application.
- `BETA-06` Replace hardcoded client connection settings with backend-provided values.
- `BETA-07` Improve sync correction strategy for outlier clients.
- `BETA-08` Rate-limit or batch client status updates.
- `BETA-09` Add beta smoke-test checklist for packaged builds.
- `BETA-10` Validate release publishing and rollback flow.
- `BETA-11` Finalize beta monitoring, alerts, and runbooks.

## Risks To Watch

- F1TV DOM or playback behavior changes may break injection or stream control without warning.
- Browser version differences between Chrome and Brave may affect automation timing.
- Desktop packaging may surface missing assets or path assumptions that do not appear in source runs.
- Sync success in small local tests may not hold under six-stream sessions unless measured explicitly.

## Recommendation

Treat the next milestone as `beta`, not `v1.0.0`.

The code review findings show the project is beyond proof-of-concept but not yet safe or stable enough for a general public release. A limited beta with tight scope, explicit known issues, and strong smoke-test discipline is the right next step.
