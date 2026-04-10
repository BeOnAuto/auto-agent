# Ketchup Plan: Fix uncaught EventEmitter "error" crash

## TODO

- [x] Burst 1: Default error listener in ConnectionManager constructor
- [ ] Burst 2: Conditional emit — only emit "error" during reconnect, not initial connect
- [ ] Burst 3: Daemon-level error listener for observability

## DONE
