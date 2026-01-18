# Ketchup Plan: Graceful Worker Suspend with UI Disconnect

## TODO

- [ ] Burst 3b: Wire cli.ts to connect preSuspendHandler (blocked on CLI publish)
- [ ] Burst 5: WorkerWakeContext provides suspended state and wake() function
- [ ] Burst 6: workspace-context uses WorkerWakeContext for suspend handling
- [ ] Burst 7: use-node-status-events stops reconnecting when suspended
- [ ] Burst 8: Pipeline UI shows "Sleeping" with wake link when suspended
- [ ] Burst 9: dispatchCommand auto-wakes before sending commands
- [ ] Burst 10: AI generation (wire connect) auto-wakes before connecting

## DONE

- [x] Burst 1: FileSyncer.broadcastSuspend() emits 'worker:suspending' to all clients (fc700bff)
- [x] Burst 2: ServerHandle exposes onPreSuspend callback wired to broadcastSuspend (fc1fba40)
- [x] Burst 3a: Pre-suspend middleware with 2s delay (on.auto-2: 5e58d31)
- [x] Burst 4: Supervisor calls worker pre-suspend before Fly API suspend (on.auto-2: dc5038d)
