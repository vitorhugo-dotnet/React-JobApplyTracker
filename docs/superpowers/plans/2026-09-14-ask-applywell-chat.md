# Ask ApplyWell Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the responsive Ask ApplyWell chat client against backend issue `SpringBoot-JobApplyTracker#81` and PR `#82`.

**Architecture:** A focused assistant API module owns authenticated POST-SSE parsing. A reusable chat surface owns transient message state and streaming UI, while layout adapters present it as a bottom-right desktop popup and a full-screen mobile experience launched from the existing Speed Dial.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, Playwright, Fetch Streams/SSE.

**Spec:** Backend contract in `vitorhugo-dotnet/SpringBoot-JobApplyTracker#81` and `#82`, plus the supplied responsive mockup.

## Global Constraints

- Use `POST /api/v1/assistant/chat` with JSON `{ "message": string }` and `Accept: text/event-stream`.
- Parse `token`, `complete`, and sanitized `error` SSE events incrementally.
- Keep messages in component memory only; no persisted conversation history.
- Desktop uses a compact bottom-right popup; mobile launches from Speed Dial and fills the viewport.
- Preserve bearer authentication and retry once after the existing refresh-token flow.
- Provide accessible names, keyboard submission, loading, cancellation, error, and retry affordances.

---

### Task 1: Streaming API client

**Files:**
- Create: `src/api/assistant.ts`
- Modify: `src/lib/api.ts`
- Test: `tests/assistant.spec.ts`

**Interfaces:**
- Produces: `streamAssistantMessage(message, handlers, signal): Promise<void>` and a reusable authenticated token refresh helper.

- [ ] Write a Playwright test whose mocked SSE response splits events across stream chunks and assert incremental content plus completion sources.
- [ ] Run `npx playwright test tests/assistant.spec.ts` and verify failure because the assistant UI/API does not exist.
- [ ] Implement a UTF-8 streaming SSE parser, typed event payloads, authorization, and one refresh retry.
- [ ] Re-run the focused test and verify the API behavior passes.

### Task 2: Responsive assistant UI

**Files:**
- Create: `src/components/assistant/AssistantChat.tsx`
- Create: `src/components/assistant/AssistantLauncher.tsx`
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/components/layout/MobileNav.tsx`
- Modify: `src/components/ui/icons.tsx`
- Test: `tests/assistant.spec.ts`

**Interfaces:**
- Consumes: `streamAssistantMessage`.
- Produces: desktop popup launcher and `onOpenAssistant` Speed Dial action for mobile.

- [ ] Add failing desktop tests for open, send, streamed answer, disabled duplicate send, close, retry, and source metadata.
- [ ] Add failing mobile tests that verify the assistant is a Speed Dial action and opens a full-screen dialog.
- [ ] Implement transient chat state, welcome copy, suggested prompts, accessible dialog semantics, abort-on-close, and error retry.
- [ ] Re-run focused tests at desktop and mobile sizes until green.

### Task 3: Verification and delivery

**Files:**
- Modify: `tests/support/mockApi.ts`

**Interfaces:**
- Produces: deterministic E2E mock coverage for the assistant contract.

- [ ] Run `npm run lint`, `npm run typecheck`, `npm run build`, and the complete Playwright suite.
- [ ] Review the diff against every global constraint and remove any unrelated changes.
- [ ] Commit on `feat/81-ask-applywell-chat-ui`, publish the branch through GitHub, and open a frontend PR linking backend issue #81 and PR #82.
