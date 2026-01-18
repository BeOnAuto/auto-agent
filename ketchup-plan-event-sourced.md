# Ketchup Plan: Refactor Pipeline Activity Tracking to Event-Sourced

## Context

The current `onPipelineActivity` callback intercepts HTTP POST /command via middleware - this is not event-sourced. In an event-sourced system, all activity flows through the message bus. We should tap into `subscribeAll()` to track all events.

**Key discovery**: Commands trigger events via handler return values, and `subscribeAll()` receives ALL events. No need to track commands separately.

## TODO

- [ ] Burst 2: Export MessageBus type from pipeline package (auto-engineer-1)
- [ ] Burst 3: Replace onPipelineActivity with onEvent using subscribeAll (auto-engineer-1)
- [ ] Burst 4: Wire up cli.ts with onEvent callback (on.auto-1)

## DONE

- [x] Burst 1: Add getMessageBus() method to PipelineServer (06beb24)
