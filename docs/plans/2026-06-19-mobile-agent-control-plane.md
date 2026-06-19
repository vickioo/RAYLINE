# Mobile Agent Control Plane

**Date:** 2026-06-19
**Status:** chg1 design approved for implementation
**Branch:** `codex/mobile-agent-control-plane-chg1`

## Goal

Make RayLine usable as a mobile-first control plane for terminal AI agents running on local machines, SSH hosts, and phone-hosted Termux or Ubuntu environments.

The first milestone is not a new runtime layer. It is the mobile shell that makes the existing chat, model picker, approvals, artifacts, and remote SSH work usable on narrow portrait screens.

## Product Direction

RayLine should become a unified interface for AI-native runtimes, not just a desktop chat wrapper. A user should be able to supervise Codex, Claude Code, Gemini CLI, Qwen Code, OpenCode, Multica, and future agent runtimes from one surface while choosing where they run and which network/API exit they use.

This direction is strongest when RayLine is framed as:

- a mobile-first control plane for terminal AI agents;
- a profile manager for local, phone, LAN, VPS, and managed SSH hosts;
- a provider/runtime router for API endpoints, proxies, and domestic or international model paths;
- an artifact bridge that returns files, screenshots, and patches to the user's current device.

## chg1 Scope

`chg1` creates the minimum mobile shell needed before deeper remote/runtime work:

- Detect compact portrait-width viewports.
- Keep the main chat pane full width on mobile.
- Move the sidebar from persistent width consumption to an overlay drawer on mobile.
- Keep the composer wide enough to type and send.
- Let the header controls scroll or wrap instead of pushing the chat body off screen.
- Preserve existing desktop layout.

## chg1 Non-goals

- No new SSH profile schema yet.
- No proxy routing or provider endpoint manager yet.
- No runtime registry refactor yet.
- No changes to Claude, Codex, Multica, OpenCode, or remote execution behavior.
- No PWA, mobile app shell, push notifications, or authentication changes.

## Design

### Mobile Shell

At compact width, RayLine treats the sidebar as a temporary navigation drawer. The chat area owns the viewport. Sidebar open state controls an overlay with a scrim; selecting a conversation or tapping the scrim closes the drawer.

This keeps the existing sidebar component intact while changing only its container behavior.

### Header

The desktop header keeps one row. The compact header allows the left title/tabs and right controls to use separate rows when needed. Tool groups use horizontal overflow instead of shrinking inner controls to unusable widths.

### Composer

The composer remains centered on desktop. On compact screens it becomes full width with smaller side padding, a stable textarea min-width, and tighter footer spacing.

### Verification

Minimum verification for chg1:

- Desktop viewport still matches the existing layout.
- 390px portrait viewport shows a usable chat surface.
- Composer textarea is visible and can receive focus.
- Sidebar no longer permanently consumes chat width on compact screens.
- Existing build and targeted lint pass.

## Later Roadmap

### chg2: Remote Profile Manager

Replace the single `remoteSshCommand` setting with named remote profiles:

- name, SSH command, default cwd, tags, runtime detections;
- Termux/Ubuntu presets for common phone paths;
- health check history and visible connection state;
- per-profile default runtime and network profile.

Primary files:

- `src/data/remoteModels.js`
- `electron/remote-runtime.cjs`
- `electron/main.cjs`
- `src/components/Settings.jsx`

### chg3: Runtime Registry

Introduce a runtime registry for Claude, Codex, Gemini, Qwen, OpenCode, Multica, and future agents. Each runtime owns detection, launch args, stream parsing, resume support, image/file support, and environment shaping.

This should remove hardcoded remote Claude/Codex assumptions and make mobile/SSH profiles useful across providers.

### chg4: Network Profiles

Add provider-aware network/API routing:

- OpenAI-compatible endpoint and key profile;
- Anthropic endpoint and key profile;
- Gemini/Qwen/OpenCode-compatible env profiles;
- HTTP(S)/SOCKS proxy env support;
- per-provider and per-remote defaults.

The UI should call this "Network Profiles" rather than only "proxy settings" because the feature routes AI exits, base URLs, and proxy env together.

### chg5: Mobile Agent Operations

Add mobile-first controls for long-running agent work:

- approval cards;
- compact command/tool logs;
- pause, cancel, resume, and follow-up;
- artifact inbox backed by the existing SSH remote channel;
- reconnect/resume indicators.

### chg6: Public Demo Package

Prepare a GitHub-trending friendly slice:

- README positioning: "A mobile-first control plane for terminal AI agents";
- mi15 Termux Ubuntu demo;
- Mac host demo;
- remote VPS demo;
- screenshots and short videos for narrow portrait and desktop.

## Risks

- Termux background lifecycle, battery, and network sleep can interrupt sessions.
- SSH auth and key management must avoid storing secrets in plain UI state.
- Provider CLIs differ in stream format, TTY expectations, resume semantics, and image support.
- Proxy/env routing can leak tokens if logged carelessly.
- Mobile browser and Electron webview constraints require careful viewport testing.

## Success Criteria

`chg1` succeeds when RayLine is visibly usable on a phone-width viewport without changing desktop behavior. Later changes can then focus on remote profiles, runtime adapters, and network routing without fighting the layout.
