# Ketchup Plan: Graceful Worker Suspend with UI Disconnect

## TODO

- [ ] Burst 1: FileSyncer.broadcastSuspend() emits 'worker:suspending' to all clients
- [ ] Burst 2: ServerHandle exposes onPreSuspend callback wired to broadcastSuspend
- [ ] Burst 3: Worker CLI adds /internal/pre-suspend endpoint with 2s timeout
- [ ] Burst 4: Supervisor calls worker pre-suspend before Fly API suspend
- [ ] Burst 5: WorkerWakeContext provides suspended state and wake() function
- [ ] Burst 6: workspace-context uses WorkerWakeContext for suspend handling
- [ ] Burst 7: use-node-status-events stops reconnecting when suspended
- [ ] Burst 8: Pipeline UI shows "Sleeping" with wake link when suspended
- [ ] Burst 9: dispatchCommand auto-wakes before sending commands
- [ ] Burst 10: AI generation (wire connect) auto-wakes before connecting

## DONE
