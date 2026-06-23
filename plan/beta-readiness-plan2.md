# F1 Mega Streamer — Beta Go/No-Go Decision Plan

## Purpose

This plan exists to answer a single question: **Is the F1 Mega Streamer safe and stable enough to put in the hands of beta testers?**

It is organized risk-first. Each risk maps directly to one or more code review findings (`finding-01` through `finding-09`). A risk is either **resolved** (evidence of a fix exists and has been verified) or **open** (no evidence, partial fix only, or verification is missing). Any single open **MUST-FIX** risk is a **NO-GO**. An accumulation of open **SHOULD-FIX** risks is a judgment call for the decision owner.

This plan does not describe a phased build sequence. It describes what evidence must exist before a go decision can be made.

---

## Decision Owner

The person calling go/no-go must inspect the evidence column for every risk, confirm it is not self-certified by the author of the fix, and sign off on the final record. If the decision owner is uncertain, the default is **NO-GO**.

---

## Risk Registry

Each risk has a severity, the finding(s) it is derived from, a clear description of the danger to beta users, and the evidence required to clear it.

### RISK-01 — Volume Control Is Broken End-to-End

| Field | Value |
|---|---|
| **Severity** | MUST-FIX |
| **Source finding** | `finding-01` |
| **Description** | A property name mismatch between the Control Panel UI frontend and the Electron backend IPC handler means volume control never reaches the target stream. The feature is silently broken. Beta testers who try to adjust audio levels will see no effect and may assume the entire control surface is unreliable. |
| **Threat to beta** | Functional regression; erodes tester confidence in all controls, not just volume. |
| **Evidence required to clear** | A passing end-to-end test or documented manual verification showing the correct IPC property name is used on both sides and that the volume of an active stream changes in response to a slider move in the control panel. |
| **Current status** | ❌ Open |

---

### RISK-02 — CDP Port Is Exposed to Local Network Attacks

| Field | Value |
|---|---|
| **Severity** | MUST-FIX |
| **Source finding** | `finding-02` |
| **Description** | The Chrome DevTools Protocol (CDP) remote debugging port is not restricted to localhost with proper binding or authentication. Any process or user on the same network segment can connect to the browser under the app's control and execute arbitrary JavaScript, exfiltrate session cookies, or hijack F1TV playback. This directly contradicts the mitigation `MIT-02` that was specified in the threat model (`T-01`). |
| **Threat to beta** | Critical security vulnerability affecting every beta tester on a shared or home network. |
| **Evidence required to clear** | Code review or test output confirming the CDP port binds only to 127.0.0.1, that an authentication or allowlist mechanism is in place, or that the remote debugging interface is disabled for production builds and the threat model entry `T-01` is marked resolved. |
| **Current status** | ❌ Open |

---

### RISK-03 — Injectable Client Loads from a Mutable Disk Path

| Field | Value |
|---|---|
| **Severity** | MUST-FIX |
| **Source finding** | `finding-03` |
| **Description** | The script that is injected into managed browser windows is read from a disk path at runtime rather than being bundled and embedded in the application package. Any local process with write access to that path can replace the injected script with malicious code, which the app will then inject into an authenticated F1TV session. This is the primary attack vector identified in threat model entries `ID-01` and the injection-based class of issues. Mitigation `MIT-03` was specified for this exact scenario and was not implemented. |
| **Threat to beta** | On-disk tampering enables credential theft or session hijacking via the app itself; unacceptable for any public distribution. |
| **Evidence required to clear** | Build output or packaging verification showing the injected client script is bundled inside the application package (e.g., embedded in the Electron ASAR or equivalent), cannot be replaced without re-signing the package, and is not read from a writable user directory at runtime. |
| **Current status** | ❌ Open |

---

### RISK-04 — React Cleanup Logic Throws Runtime Errors

| Field | Value |
|---|---|
| **Severity** | MUST-FIX |
| **Source finding** | `finding-04` |
| **Description** | The `useEffect` cleanup logic in the Control Panel UI is incorrect. When streams are added or removed, the cleanup function runs against stale references or in an unexpected order, producing unhandled JavaScript errors. These errors may leave the UI in a broken state, requiring the user to restart the entire application. |
| **Threat to beta** | Correctness defect that triggers on normal stream management operations, blocking the primary user workflow (US-03, US-04). |
| **Evidence required to clear** | A targeted fix to the effect cleanup logic, with automated unit or integration test coverage showing that adding and removing streams multiple times in succession does not produce unhandled exceptions or leave stale listeners registered. |
| **Current status** | ❌ Open |

---

### RISK-05 — Stream Registration Is Fragile After Orchestration Regression

| Field | Value |
|---|---|
| **Severity** | MUST-FIX |
| **Source finding** | `finding-05` |
| **Description** | A regression in the Browser Orchestrator's page acquisition logic makes attaching to a newly opened browser window unreliable. The app may launch a window that never registers for synchronized control, leaving the user with an unmanaged stream that cannot be paused, seeked, or volume-adjusted through the master controls. This breaks the core pop-out and register workflow (US-03). |
| **Threat to beta** | Core functionality regression; beta testers will encounter silent failures when opening streams. |
| **Evidence required to clear** | Verified fix and manual or automated test demonstrating that a new browser window opens, is detected by the Browser Orchestrator via CDP, and appears as a managed stream in the control panel within a consistent time window. |
| **Current status** | ❌ Open |

---

### RISK-06 — Hardcoded WebSocket URL Will Break in Non-Standard Configurations

| Field | Value |
|---|---|
| **Severity** | SHOULD-FIX |
| **Source finding** | `finding-09` |
| **Description** | The Injected Sync Client contains a hardcoded WebSocket URL for connecting back to the Electron backend. If the port changes for any reason (conflict, future configuration, or user environment), the client fails silently and no streams synchronize. The correct approach is for the backend to provide the connection details dynamically when injecting the script. |
| **Threat to beta** | Brittle integration point; port conflicts on some tester machines could produce total sync failure with no obvious error message. |
| **Evidence required to clear** | Code showing the backend injects the WebSocket URL or port dynamically into the client script at injection time, and that the client uses only that value rather than any hardcoded constant. |
| **Current status** | ❌ Open |

---

### RISK-07 — Naive Auto-Sync Destabilizes All Streams on Outlier Drift

| Field | Value |
|---|---|
| **Severity** | SHOULD-FIX |
| **Source finding** | `finding-06` |
| **Description** | The auto-sync mechanism does not distinguish between a stream that is genuinely drifting and a stream that has temporarily stalled, buffered, or lost its time signal. A naive implementation will attempt to correct against a broken outlier, pulling all other streams out of alignment. Under six-stream conditions this is likely to produce cascading corrections rather than stability. The `FR-5` requirement of <0.5 second inter-stream drift cannot be reliably met in this state. |
| **Threat to beta** | Sync quality degradation under realistic multi-stream load; directly impacts the primary value proposition. |
| **Evidence required to clear** | A documented improvement to the sync algorithm (e.g., outlier exclusion, median anchoring, or hysteresis band) with measurement results from a session using at least three simultaneous streams showing drift stays within the `FR-5` tolerance under play, pause, and seek operations. |
| **Current status** | ❌ Open |

---

### RISK-08 — High-Frequency Client Status Updates Risk Local DoS

| Field | Value |
|---|---|
| **Severity** | SHOULD-FIX |
| **Source finding** | `finding-07` |
| **Description** | The Injected Sync Client emits status updates at a rate that, under multiple simultaneous streams, can saturate the local WebSocket server and the Electron main process event loop. This is the `DOS-02` risk from the threat model. At low stream counts the impact may be invisible; at five or six streams, IPC lag can delay playback commands, causing sync drift to exceed the 0.5 second threshold and making the control panel feel unresponsive. |
| **Threat to beta** | Performance degradation at the stream counts that define the product's maximum-value scenario. |
| **Evidence required to clear** | A rate-limiting or batching mechanism is applied to client status updates, with a measured message rate at maximum stream count (six streams) showing no observable IPC lag on the target hardware specifications for beta. |
| **Current status** | ❌ Open |

---

## Go/No-Go Gate

### Hard Gate — All MUST-FIX Risks Resolved

The following risks **must all be cleared** before any beta build is published. If any one remains open, the decision is **NO-GO** regardless of other progress.

| Risk ID | Finding | One-Line Summary |
|---|---|---|
| RISK-01 | `finding-01` | Volume IPC mismatch — feature is broken |
| RISK-02 | `finding-02` | CDP port unsecured — network attack vector |
| RISK-03 | `finding-03` | Injectable client loads from disk — tamper risk |
| RISK-04 | `finding-04` | React cleanup errors — UI breaks on stream changes |
| RISK-05 | `finding-05` | Page acquisition regression — streams don't register |

**Current hard gate status: NO-GO (5 of 5 MUST-FIX risks are open)**

---

### Judgment Gate — SHOULD-FIX Risks

The following risks must be reviewed by the decision owner. They do not automatically block a go decision but must each receive a documented disposition (fix accepted, or risk accepted with rationale).

| Risk ID | Finding | One-Line Summary | Acceptable to defer? |
|---|---|---|---|
| RISK-06 | `finding-09` | Hardcoded WebSocket URL — brittle on port conflict | Only with a known-good default and a visible error if connection fails |
| RISK-07 | `finding-06` | Naive auto-sync — drift under outlier conditions | Only if beta is capped to ≤3 simultaneous streams |
| RISK-08 | `finding-07` | High-frequency status updates — IPC saturation risk | Only if beta hardware exceeds minimum spec and stream cap is enforced |

If RISK-06, RISK-07, and RISK-08 are all deferred, the beta must explicitly document the corresponding known limitations in the release notes and must cap stream count at three.

---

## Verification Checklist

Before calling GO, the decision owner must walk through each item and record the result. Unchecked items mean the decision cannot be made.

### Security

- [ ] CDP port configuration reviewed and confirmed restricted to localhost
- [ ] Injectable client script is not read from a writable user path in production builds
- [ ] App package does not expose a remote debugging interface to the network

### Correctness

- [ ] Volume control IPC property names match on frontend and backend
- [ ] Volume slider in control panel produces audible and measurable change in the target stream
- [ ] React `useEffect` cleanup verified through add/remove stream cycles with no unhandled exceptions
- [ ] Browser Orchestrator page acquisition verified with at least two stream open/close cycles

### Sync Quality

- [ ] Multi-stream session with three or more streams demonstrates drift <0.5 s after play, pause, and seek
- [ ] WebSocket URL or port is provided dynamically by the backend (or deferral is documented)
- [ ] Status update rate at three streams does not produce observable IPC lag

### Release Readiness

- [ ] Versioned packaged installer exists for Windows 11
- [ ] Versioned packaged installer exists for macOS
- [ ] Smoke test passes on both platforms from a packaged installer (not a source run)
- [ ] Rollback procedure (artifact retraction) tested or confirmed against the `publish_release_artifacts` step
- [ ] Monitoring alerts from `ops/monitoring_plan.json` are active and reachable (artifact availability, launch failure, WebSocket unresponsive, orchestration failure, sync drift)
- [ ] At least one runbook has been walked through end-to-end by someone other than its author

### Beta Scoping

- [ ] Known issues list drafted and included in the beta release notes
- [ ] Beta stream count limit documented if RISK-07 or RISK-08 are deferred
- [ ] Beta tester feedback channel and issue template are in place

---

## Decision Record Template

Fill in this section at the time of the decision.

```
Date:
Decision owner:
Build version:

Hard gate (MUST-FIX risks):
  RISK-01 (finding-01):  RESOLVED / OPEN
  RISK-02 (finding-02):  RESOLVED / OPEN
  RISK-03 (finding-03):  RESOLVED / OPEN
  RISK-04 (finding-04):  RESOLVED / OPEN
  RISK-05 (finding-05):  RESOLVED / OPEN

Judgment gate (SHOULD-FIX risks):
  RISK-06 (finding-09):  RESOLVED / DEFERRED — [rationale]
  RISK-07 (finding-06):  RESOLVED / DEFERRED — [rationale]
  RISK-08 (finding-07):  RESOLVED / DEFERRED — [rationale]

Beta stream cap (if any risks deferred): [N streams / no cap]

Decision:  GO / NO-GO

Reason (required for NO-GO or any deferred risk):
```

---

## What This Plan Does Not Cover

This plan is a decision gate, not a build specification. It does not prescribe sprint organization, ticket sequencing, or team assignments. For the implementation sequence, see `plan/beta-readiness-plan.md`. For release engineering steps, see `ops/release_plan.json`. For monitoring thresholds and runbooks, see `ops/monitoring_plan.json`.

The plan also does not address optional feature `OF-1` (per-stream volume mixer, `US-05`) beyond RISK-01. If volume control remains deferred after RISK-01 is resolved, that must be documented in the beta known-issues list but is not itself a go/no-go blocker.
